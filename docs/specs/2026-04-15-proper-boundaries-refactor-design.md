# Proper Boundaries Refactor — Design Spec

## Problem

The app has two rendering systems (React for UI, ProseMirror for the editor) joined by five hooks in `App.tsx` that act as a manual switchboard. This causes:

1. **Broken hover state**: Sidebar-to-editor hover highlighting uses direct DOM manipulation (`classList.add`) on ProseMirror-owned elements. ProseMirror can silently overwrite these classes on any DOM reconciliation.
2. **App.tsx is a 350-line switchboard**: All hooks meet at the top component and drill ~25 values into children. Every feature change touches App.
3. **`use-comments.ts` does 4 jobs**: Persistence, domain logic, editor mutations, and clipboard export in one 300-line hook.
4. **Performance hotspots**: Unthrottled `pointermove` (~60-144Hz with DOM traversals), `doc.descendants()` on every keystroke, synchronous `localStorage` writes in the keystroke path.
5. **Layer violations**: `lib/comment-anchoring.ts` imports from `hooks/`, inter-hook imports for non-hook functions.

## Goal

Give each system its own domain. ProseMirror manages ProseMirror state. React manages UI state. They communicate through well-defined interfaces, not DOM queries.

## Architecture

Four layers, applied in order. Each layer is independently shippable — earlier layers don't depend on later ones being complete.

---

## Layer 1: Types & Utilities

Fix the dependency graph so it flows downward: `types/ → lib/ → extensions/ → hooks/ → components/`.

### New files

| File | Responsibility |
|------|---------------|
| `src/types/comment.ts` | `Comment`, `CommentMessage` interfaces; `isComment`, `isCommentMessage` validators |
| `src/lib/editor-utils.ts` | `removeCommentMarkFromEditor`, `forEachCommentMark` — pure ProseMirror document utilities |
| `src/extensions/comment-shortcuts.ts` | `CommentShortcuts` extension (moved from inline in `editor.tsx`) |

### Moves

| From | What | To |
|------|------|-----|
| `hooks/use-comments.ts` | `Comment`, `CommentMessage`, `isComment`, `isCommentMessage` | `types/comment.ts` |
| `hooks/use-comments.ts` | `removeCommentMarkFromEditor` | `lib/editor-utils.ts` |
| `components/editor.tsx` | `CommentShortcuts` extension (lines 12-33) | `extensions/comment-shortcuts.ts` |

### New utility: `forEachCommentMark`

The pattern `doc.descendants(node => { node.marks.forEach(mark => { if (mark.type.name === "commentMark") ... }) })` appears in 3 files. Extract to a shared iterator:

```typescript
function forEachCommentMark(
  doc: Node,
  callback: (commentId: string, from: number, to: number) => void
): void
```

Used by: `use-editor-comment-sync.ts` (mark ID collection), `use-comments.ts` (`syncCommentAnchorsFromEditor`), `lib/editor-utils.ts` (`removeCommentMarkFromEditor`).

### Dependency graph after

```
types/comment.ts          (no imports)
     ↑
lib/comment-anchoring.ts  (imports types/)
lib/editor-utils.ts       (imports types/, @tiptap/core)
lib/utils.ts              (no internal imports)
     ↑
extensions/comment-mark.ts
extensions/comment-shortcuts.ts
     ↑
hooks/*                   (import from lib/, types/, extensions/)
     ↑
components/*              (import from hooks/, lib/, types/)
```

---

## Layer 2: ProseMirror Plugin on `CommentMark`

Add `addProseMirrorPlugins()` to the `CommentMark` extension. This moves editor-side behavior into ProseMirror's own plugin system.

### 2a. Decoration-based hover highlighting

**Plugin state:** `{ hoveredCommentId: string | null }`

**React → ProseMirror bridge:** A single exported function:

```typescript
function setHoveredComment(editor: Editor, commentId: string | null): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(commentHoverPluginKey, commentId)
  )
}
```

**Plugin behavior:** In `state.apply()`, check for the meta key. If present, rebuild a `DecorationSet` with `Decoration.inline(from, to, { class: "comment-mark--hot" })` for all mark ranges matching the hovered comment ID.

**What it replaces:** The first `useEffect` in `use-comment-hover.ts` — the `syncHotMark` function that does `querySelectorAll` + `classList.add/remove`.

### 2b. Pill-click handling

**Plugin behavior:** Register a `handleClick` handler in the plugin. When a click lands on a comment mark and is within the bottom 8px pill zone, read `commentId` from mark attrs and invoke a callback stored in `editor.storage.commentMark.onPillClick`.

**React sets the callback:** Via a `useEffect` that writes to editor storage after editor init:

```typescript
editor.storage.commentMark.onPillClick = (commentId: string) => {
  setActiveCommentId(commentId)
  setShowNewComment(false)
}
```

**What it replaces:** The third `useEffect` in `use-editor-comment-sync.ts` (lines 89-116) — raw `dom.addEventListener("click", ...)` with manual `getBoundingClientRect` and re-registration on every `comments` change.

### 2c. Transaction-level anchor sync (deferrable)

**Plugin behavior:** Use `appendTransaction` to maintain a `Map<string, { from, to }>` of comment mark positions that updates incrementally when the document changes.

**What it replaces:** The `editor.on("update")` subscription + `syncCommentAnchorsFromEditor` full-doc walk.

**Note:** This is the most complex piece. It can be deferred — debouncing the existing approach (Layer 4b) gets 80% of the benefit at 20% of the effort.

### What `use-comment-hover.ts` becomes (~20 lines)

1. Listens for `pointermove` (rAF-throttled) to detect which comment ID the pointer is over (sidebar or editor DOM)
2. Calls `setHoveredComment(editor, id)` to push the ID into ProseMirror
3. Returns `hoveredCommentId` for the sidebar's opacity dimming (still React state)

No more direct DOM manipulation on editor elements.

### What `use-editor-comment-sync.ts` becomes

- **Mark restoration** (first effect): Stays as-is — runs once per `comments` change to restore missing marks.
- **Anchor sync** (second effect): Debounced (Layer 4b), or replaced by plugin state read (2c).
- **Pill click** (third effect): Deleted — handled by ProseMirror plugin.

---

## Layer 3: React Context & App.tsx Simplification

### New file: `src/contexts/comment-context.tsx`

#### Context shape

```typescript
interface CommentContextValue {
  // From useComments
  comments: Comment[]
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  addComment: (editor: Editor, body: string, existingCommentId?: string) => Comment | null
  addReplyToComment: (commentId: string, body: string) => void
  deleteComment: (editor: Editor, commentId: string) => void
  copyComments: () => Promise<boolean>
  clearAllComments: () => void
  hasComments: boolean
  syncCommentAnchorsFromEditor: (editor: Editor) => void

  // From useDraftComment
  showNewComment: boolean
  setShowNewComment: (show: boolean) => void
  draftQuotedText: string
  pendingDraftCommentId: string | null
  handleAddCommentClick: () => void
  handleCloseNewComment: () => void
  handleSubmitNewComment: (body: string) => void

  // Panel state
  commentsPanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void

  // Hover state
  hoveredCommentId: string | null
}
```

#### Provider internals

`<CommentProvider editor={editor} persistenceKey={key}>` wraps:
- `useComments(persistenceKey)`
- `useDraftComment({ editor, addComment, setActiveCommentId, onDraftStarted: openPanel })`
- `useCommentHover(editor)` (simplified version from Layer 2)
- `commentsPanelOpen` state with `togglePanel`/`closePanel`/`openPanel`

#### Consumer hook

```typescript
function useCommentContext(): CommentContextValue
```

Throws if used outside provider.

### App.tsx after (~100 lines)

```
App
├── useFile()
├── editor state (useState)
├── <ReviewHeader />
├── <OutdatedReloadDialog />
├── <CommentProvider editor={editor} persistenceKey={key}>
│   ├── <EditorCommentSync />
│   ├── <AppKeyboardShortcuts />
│   ├── <AppDismissHandler />
│   ├── <Editor />
│   ├── <CommentSidebar />
│   └── <BottomToolbar />
└── layout shell
```

### Impact on child components

| Component | Before | After |
|-----------|--------|-------|
| `CommentSidebar` | 11 props | 0 props — reads from `useCommentContext()` |
| `BottomToolbar` | 5 props | 0 props — reads from `useCommentContext()` |
| `Editor` | 6 props | 4 props — `content`, `onUpdate`, `contentReloadNonce`, `onEditorReady` (file concerns stay as props; `bubbleMenuSuppressed` and `onAddComment` read from context) |

### Thin wrapper components (extracted from App.tsx effects)

| Component | Responsibility | Source |
|-----------|---------------|--------|
| `EditorCommentSync` | Mark restoration + anchor sync | Wraps `useEditorCommentSync` in a component inside the provider |
| `AppKeyboardShortcuts` | Escape + ⌘⇧L handling | Extracted from App.tsx effects (lines 156-190) |
| `AppDismissHandler` | Outside-click-to-collapse | Extracted from App.tsx effect (lines 192-222) |

These are renderless components (return `null`) whose only purpose is isolating effect logic so App.tsx stays clean. They read from context instead of receiving props.

---

## Layer 4: Performance Fixes

Applied alongside their host files as each layer is implemented.

### 4a. rAF-throttled `pointermove`

**Where:** `use-comment-hover.ts`

Store latest `PointerEvent` target in a ref. Schedule one `requestAnimationFrame` per frame (guarded by pending flag). The rAF callback does the `.closest()` traversal and calls `setHoveredComment(editor, id)`.

Collapses ~60-144 events/sec into 1 DOM lookup per frame.

### 4b. Debounced anchor sync

**Where:** `use-editor-comment-sync.ts`

Wrap `syncCommentAnchorsFromEditor` in a 300ms trailing debounce. Full `doc.descendants()` walk only runs after the user pauses typing.

### 4c. Debounced localStorage persistence

**Where:** `use-comments.ts`

Replace the synchronous `useEffect` → `localStorage.setItem` with a 500ms trailing debounce. Prevents blocking the main thread on every keystroke via the anchor sync cascade.

### 4d. `React.memo` on `ThreadRow`

**Where:** `comment-sidebar.tsx`

Wrap `ThreadRow` in `React.memo`. The `dimForLink` opacity is applied on the wrapper `<div>` in the parent `.map()`, not inside `ThreadRow`, so memo works correctly.

### 4e. Stable event handler refs

**Where:** `App.tsx` Escape listener, `use-editor-comment-sync.ts` click handler

Store handler functions in refs and read from the ref inside the listener. Removes volatile dependencies from effect arrays, preventing listener tear-down/re-attach on every state change.

---

## Sequencing

| Order | Layer | Behavior change? | Risk |
|-------|-------|------------------|------|
| 1 | Layer 1: Types & utilities | No — just moves code | Minimal |
| 2 | Layer 2: ProseMirror plugin | Yes — fixes hover bug, changes click handling | Medium (ProseMirror API) |
| 3 | Layer 3: React context | No — same behavior, different wiring | Low-medium (many files touched) |
| 4 | Layer 4: Performance | No — same behavior, better perf | Low (each fix is independent) |

Each layer should be a separate commit (or small group of commits). Layer 2c (transaction-level anchor sync) can be deferred.

## Not in Scope

- No new dependencies (no Zustand, no state library)
- No changes to file loading/saving flow (`useFile` stays as-is)
- No SSE/WebSocket for file change detection (polling stays)
- No trimming of unused `components/ui/` files
- No changes to the CLI or server-side code

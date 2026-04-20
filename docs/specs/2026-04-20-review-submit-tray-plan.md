# Review Submit Tray — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "review cover sheet" tray above the bottom toolbar with a summary textarea, comment count, and Submit review action that copies a formatted review prompt to the clipboard. Retires the standalone Copy icon and remaps ⌘⇧C.

**Architecture:** Extend existing `CommentContext`/`useComments` with summary + tray-collapsed state + renamed `submitReview()`. New `ReviewTray` component consumes the context and mounts above `BottomToolbar`. Summary and collapsed flag persist per file under a new `review-md:review:v1:` localStorage key family. Rename `REVIEW_MD_COPY_COMMENTS` → `REVIEW_MD_SUBMIT_REVIEW`.

**Tech Stack:** React 19, TypeScript, Tiptap 3, Tailwind v4, Vite. No new dependencies.

**Testing approach:** This repo has no test runner; verification is `pnpm typecheck` + `pnpm lint` + a manual smoke pass at the end. Every task that compiles and lints cleanly on its own must be committable — commit frequently.

**Reference spec:** `docs/specs/2026-04-20-review-submit-tray-design.md`

---

## Task 1: Rename the event constant

**Files:**
- Modify: `src/lib/review-md-events.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/bottom-toolbar.tsx` (will be revisited in Task 9; this task only touches the event name)

- [ ] **Step 1: Rename the constant**

Replace `src/lib/review-md-events.ts` contents:

```ts
export const REVIEW_MD_ADD_COMMENT = "review-md:add-comment" as const
export const REVIEW_MD_SUBMIT_REVIEW = "review-md:submit-review" as const
export const REVIEW_MD_CLEAR_ALL_COMMENTS =
  "review-md:clear-all-comments" as const
```

- [ ] **Step 2: Update App.tsx imports and references**

In `src/App.tsx`, update the import block (currently lines 19–23):

```ts
import {
  REVIEW_MD_ADD_COMMENT,
  REVIEW_MD_CLEAR_ALL_COMMENTS,
  REVIEW_MD_SUBMIT_REVIEW,
} from "@/lib/review-md-events"
```

In the `AppCommandListeners` component, replace every occurrence of `REVIEW_MD_COPY_COMMENTS` with `REVIEW_MD_SUBMIT_REVIEW`. Also rename the local handler variable `onCopy` to `onSubmit` for clarity:

```ts
    const onSubmit = () => {
      if (ref.current.hasComments) void ref.current.copyComments()
    }
```

```ts
    window.addEventListener(REVIEW_MD_SUBMIT_REVIEW, onSubmit)
```

```ts
      window.removeEventListener(REVIEW_MD_SUBMIT_REVIEW, onSubmit)
```

And in the ⌘⇧C keyboard handler (currently dispatches `REVIEW_MD_COPY_COMMENTS`):

```ts
      window.dispatchEvent(new CustomEvent(REVIEW_MD_SUBMIT_REVIEW))
```

- [ ] **Step 3: Update bottom-toolbar.tsx import (name only)**

`src/components/bottom-toolbar.tsx` currently imports `REVIEW_MD_CLEAR_ALL_COMMENTS` only. No change needed here yet. Confirm with grep:

Run: `grep -rn REVIEW_MD_COPY_COMMENTS src/`
Expected: no matches.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/review-md-events.ts src/App.tsx
git commit -m "refactor: rename copy-comments event to submit-review"
```

---

## Task 2: Create `useReviewState` hook with per-file persistence

**Files:**
- Create: `src/hooks/use-review-state.ts`

- [ ] **Step 1: Implement the hook**

Write `src/hooks/use-review-state.ts`:

```ts
import { useCallback, useEffect, useState } from "react"

const STORAGE_PREFIX = "review-md:review:v1:"

interface PersistedReview {
  summary: string
  trayCollapsed: boolean
}

function storageKey(fileKey: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(fileKey)}`
}

function loadPersisted(fileKey: string): PersistedReview {
  try {
    const raw = localStorage.getItem(storageKey(fileKey))
    if (!raw) return { summary: "", trayCollapsed: false }
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== "object") {
      return { summary: "", trayCollapsed: false }
    }
    const obj = data as Record<string, unknown>
    return {
      summary: typeof obj.summary === "string" ? obj.summary : "",
      trayCollapsed:
        typeof obj.trayCollapsed === "boolean" ? obj.trayCollapsed : false,
    }
  } catch {
    return { summary: "", trayCollapsed: false }
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function savePersisted(fileKey: string, value: PersistedReview) {
  if (saveTimeout !== null) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(storageKey(fileKey), JSON.stringify(value))
    } catch {
      // quota / private mode
    }
  }, 500)
}

function initial(persistenceKey: string | null): {
  summary: string
  trayCollapsed: boolean
  loadedKey: string | null
} {
  if (!persistenceKey) {
    return { summary: "", trayCollapsed: false, loadedKey: null }
  }
  const persisted = loadPersisted(persistenceKey)
  return { ...persisted, loadedKey: persistenceKey }
}

export function useReviewState(persistenceKey: string | null) {
  const [seed] = useState(() => initial(persistenceKey))
  const [summary, setSummaryState] = useState(seed.summary)
  const [trayCollapsed, setTrayCollapsedState] = useState(seed.trayCollapsed)
  const [loadedKey, setLoadedKey] = useState(seed.loadedKey)

  useEffect(() => {
    if (!persistenceKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persistence key cleared
      setSummaryState("")
      setTrayCollapsedState(false)
      setLoadedKey(null)
      return
    }
    const next = loadPersisted(persistenceKey)
    setSummaryState(next.summary)
    setTrayCollapsedState(next.trayCollapsed)
    setLoadedKey(persistenceKey)
  }, [persistenceKey])

  useEffect(() => {
    if (!persistenceKey || loadedKey !== persistenceKey) return
    savePersisted(persistenceKey, { summary, trayCollapsed })
  }, [persistenceKey, loadedKey, summary, trayCollapsed])

  const setSummary = useCallback((next: string) => {
    setSummaryState(next)
  }, [])

  const setTrayCollapsed = useCallback((next: boolean) => {
    setTrayCollapsedState(next)
  }, [])

  const resetReview = useCallback(() => {
    setSummaryState("")
    setTrayCollapsedState(false)
  }, [])

  return {
    summary,
    setSummary,
    isReviewTrayCollapsed: trayCollapsed,
    setReviewTrayCollapsed: setTrayCollapsed,
    resetReview,
  }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean. (Hook is unused; that's fine for this step.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-review-state.ts
git commit -m "feat: add useReviewState hook for summary + tray-collapsed persistence"
```

---

## Task 3: Rename `copyComments` → `submitReview` and `formatComments` → `formatReview(summary)`

**Files:**
- Modify: `src/hooks/use-comments.ts`

- [ ] **Step 1: Update the formatter**

In `src/hooks/use-comments.ts`, replace the `formatComments` callback (currently lines 168–185) with:

```ts
  const formatReview = useCallback(
    (summary: string): string => {
      const fileLabel = persistenceKey?.trim() || "this file"
      const header = `Review of \`${fileLabel}\``

      const trimmedSummary = summary.trim()
      const summaryBlock = trimmedSummary
        ? ["Summary:", trimmedSummary].join("\n")
        : null

      const threadsBlock = comments.length
        ? [
            "Inline comments:",
            comments
              .map((c) => {
                const thread = c.messages.map((m) => `- ${m.body}`).join("\n")
                return `> ${c.quotedText}\n${thread}`
              })
              .join("\n\n"),
          ].join("\n")
        : null

      return [header, summaryBlock, threadsBlock]
        .filter((s): s is string => s !== null)
        .join("\n\n")
    },
    [comments, persistenceKey],
  )
```

- [ ] **Step 2: Rename `copyComments` → `submitReview`, accept summary**

In the same file, replace the `copyComments` callback (currently lines 270–281) with:

```ts
  const submitReview = useCallback(
    async (summary: string): Promise<boolean> => {
      const text = formatReview(summary)
      try {
        await navigator.clipboard.writeText(text)
        toast.success("Review copied to clipboard")
        return true
      } catch (e) {
        console.error("Failed to copy review:", e)
        toast.error("Failed to copy review")
        return false
      }
    },
    [formatReview],
  )
```

- [ ] **Step 3: Update the returned object**

At the bottom of `useComments`, replace `copyComments` with `submitReview` in the returned object:

```ts
  return {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    editCommentMessage,
    syncCommentAnchorsFromEditor,
    deleteComment,
    deleteCommentMessage,
    submitReview,
    clearAllComments,
    hasComments: comments.length > 0,
  }
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: FAIL — downstream consumers (`CommentContext`, `App.tsx`, `BottomToolbar`) still reference `copyComments`. That's expected; the next tasks repair the call sites. Do not commit yet.

---

## Task 4: Thread review state through `CommentContext`

**Files:**
- Modify: `src/contexts/comment-context.tsx`

- [ ] **Step 1: Import and compose `useReviewState`**

At the top of `src/contexts/comment-context.tsx`, add:

```ts
import { useReviewState } from "@/hooks/use-review-state"
```

- [ ] **Step 2: Update the context value interface**

Replace the `CommentContextValue` interface to drop `copyComments` and add the new fields:

```ts
interface CommentContextValue {
  comments: Comment[]
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  addComment: (editor: Editor, body: string, existingCommentId?: string) => Comment | null
  addReplyToComment: (commentId: string, body: string) => void
  editCommentMessage: (commentId: string, messageId: string, body: string) => void
  deleteComment: (editor: Editor, commentId: string) => void
  deleteCommentMessage: (
    editor: Editor,
    commentId: string,
    messageId: string,
  ) => void
  submitReview: () => Promise<boolean>
  clearAllComments: () => void
  hasComments: boolean
  syncCommentAnchorsFromEditor: (editor: Editor) => void

  showNewComment: boolean
  setShowNewComment: (show: boolean) => void
  draftQuotedText: string
  pendingDraftCommentId: string | null
  handleAddCommentClick: () => void
  handleCloseNewComment: () => void
  handleSubmitNewComment: (body: string) => void

  hoveredCommentId: string | null
  clearHover: () => void

  showCommentSidebar: boolean

  summary: string
  setSummary: (next: string) => void
  isReviewTrayCollapsed: boolean
  setReviewTrayCollapsed: (next: boolean) => void
  showReviewTray: boolean
}
```

Note: `submitReview` on the context is now a **zero-arg** function — the provider supplies the current `summary` internally.

- [ ] **Step 3: Rewrite the provider body**

Replace the `useComments(persistenceKey)` destructuring (currently lines 69–82) with a renamed-alias version so the hook's `submitReview(summary)` doesn't clash with the zero-arg context-level `submitReview`:

```ts
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    editCommentMessage,
    deleteComment,
    deleteCommentMessage,
    submitReview: submitReviewWithSummary,
    clearAllComments: clearAllCommentsBase,
    hasComments,
    syncCommentAnchorsFromEditor,
  } = useComments(persistenceKey)
```

Immediately after that destructuring, add the review-state composition:

```ts
  const {
    summary,
    setSummary,
    isReviewTrayCollapsed,
    setReviewTrayCollapsed,
    resetReview,
  } = useReviewState(persistenceKey)
```

Replace the existing `clearAllComments` callback (currently lines 89–91) to also reset the review state:

```ts
  const clearAllComments = useCallback(() => {
    clearAllCommentsBase(editorRef.current)
    resetReview()
  }, [clearAllCommentsBase, resetReview])
```

Add a zero-arg `submitReview` on the context that closes over the current `summary`:

```ts
  const submitReview = useCallback(
    () => submitReviewWithSummary(summary),
    [submitReviewWithSummary, summary],
  )
```

- [ ] **Step 4: Derive `showReviewTray`**

Below the existing `showCommentSidebar` derivation:

```ts
  const showReviewTray = comments.length > 0
```

- [ ] **Step 5: Update the value object**

Replace the `value` assignment (currently lines 133–156) with:

```ts
  const value: CommentContextValue = {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    editCommentMessage,
    deleteComment,
    deleteCommentMessage,
    submitReview,
    clearAllComments,
    hasComments,
    syncCommentAnchorsFromEditor,
    showNewComment,
    setShowNewComment,
    draftQuotedText,
    pendingDraftCommentId,
    handleAddCommentClick,
    handleCloseNewComment,
    handleSubmitNewComment,
    hoveredCommentId,
    clearHover,
    showCommentSidebar,
    summary,
    setSummary,
    isReviewTrayCollapsed,
    setReviewTrayCollapsed,
    showReviewTray,
  }
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: FAIL on `App.tsx` and `bottom-toolbar.tsx` (still call `copyComments`). That's expected; Task 5 fixes those. Do not commit yet.

---

## Task 5: Update `AppCommandListeners` to call `submitReview`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `AppCommandListeners` consumers**

In `src/App.tsx`, replace the `AppCommandListeners` destructuring (currently line 118–119) with:

```ts
  const { handleAddCommentClick, submitReview, hasComments } =
    useCommentContext()
```

Update the ref shape (currently lines 120–133):

```ts
  const ref = useRef({
    handleAddCommentClick,
    submitReview,
    hasComments,
    onRequestClearAll,
  })
  useEffect(() => {
    ref.current = {
      handleAddCommentClick,
      submitReview,
      hasComments,
      onRequestClearAll,
    }
  })
```

Update `onSubmit` inside the first effect:

```ts
    const onSubmit = () => {
      if (ref.current.hasComments) void ref.current.submitReview()
    }
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: FAIL on `bottom-toolbar.tsx` only (still references `copyComments`). Task 9 will remove that.

To keep commits shippable, proceed to Task 9 **before** committing Tasks 3–5. (This plan orders Tasks 6–8 first because they are additive and won't touch the broken call site, but the commit for Tasks 3–5–9 should land together. See the commit instructions at the end of Task 9.)

---

## Task 6: Add `.review-tray` CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add the tray styles**

Insert the following block **after** the `.desk-toolbar` rule set and its `.dark` variant (after the block ending around current line 973). Place it before `.desk-panel`:

```css
/* ---------- Review tray (paper cover sheet above the toolbar) ---------- */

/* A paper-note surface that carries the review summary + submit action.
   Reuses sticky-note motifs (grain via ::before, soft shadow, rotation)
   but sits flat-ish — it reads as a cover sheet clipped to the bottom
   of the page rather than a loose sticky. */
.review-tray {
  position: relative;
  isolation: isolate;
  background-color: var(--sticky);
  color: var(--sticky-foreground);
  border: 1px solid var(--sticky-edge);
  border-radius: 4px 6px 5px 7px;
  box-shadow: var(--sticky-shadow-lift);
  transform: rotate(var(--sticky-rotate, -0.6deg));
  transition:
    transform 180ms var(--annotation-ease),
    box-shadow 400ms ease-out,
    filter 180ms var(--annotation-ease),
    background-color 400ms ease-out;
  will-change: transform;
}

.review-tray::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(
      120% 80% at 20% 0%,
      oklch(1 0 0 / 0.28),
      transparent 55%
    ),
    radial-gradient(
      120% 120% at 100% 100%,
      oklch(0 0 0 / 0.07),
      transparent 55%
    );
  mix-blend-mode: soft-light;
}

.review-tray-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.6rem 0.45rem 0.55rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in oklch, var(--sticky-foreground) 72%, transparent);
}

.review-tray-header-button {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  text-align: left;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.review-tray-clip {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
  color: color-mix(in oklch, var(--sticky-foreground) 45%, transparent);
}

.review-tray-count {
  display: inline-flex;
  align-items: center;
  padding: 0 0.4rem;
  height: 1.1rem;
  border-radius: 999px;
  background-color: color-mix(in oklch, var(--sticky-foreground) 14%, transparent);
  color: var(--sticky-foreground);
  font-size: 0.65rem;
  letter-spacing: 0.04em;
}

.review-tray-chevron {
  margin-left: auto;
  width: 0.85rem;
  height: 0.85rem;
  color: color-mix(in oklch, var(--sticky-foreground) 60%, transparent);
  transition: transform 180ms var(--annotation-ease);
}

.review-tray[data-collapsed="true"] .review-tray-chevron {
  transform: rotate(-180deg);
}

.review-tray-body {
  padding: 0 0.6rem 0.55rem 0.6rem;
  display: grid;
  gap: 0.5rem;
}

.review-tray-textarea {
  width: 100%;
  min-height: 3.75rem;
  max-height: 12rem;
  resize: vertical;
  padding: 0.5rem 0.6rem;
  background-color: color-mix(in oklch, white 30%, var(--sticky) 70%);
  color: var(--sticky-foreground);
  border: 1px dashed color-mix(in oklch, var(--sticky-foreground) 22%, transparent);
  border-radius: 3px;
  font-family: var(--font-hand);
  font-size: 0.95rem;
  line-height: 1.35;
  outline: none;
  transition:
    border-color 200ms var(--annotation-ease),
    background-color 200ms var(--annotation-ease);
}

.review-tray-textarea:focus-visible {
  border-color: color-mix(in oklch, var(--sticky-foreground) 40%, transparent);
  background-color: color-mix(in oklch, white 45%, var(--sticky) 55%);
}

.review-tray-textarea::placeholder {
  color: color-mix(in oklch, var(--sticky-foreground) 50%, transparent);
  font-style: italic;
}

.review-tray-actions {
  display: flex;
  justify-content: flex-end;
}

/* The stamp accent: red ink on the submit label only, not the surface. */
.review-tray-submit-label {
  color: oklch(0.55 0.18 25);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 600;
}

.dark .review-tray-submit-label {
  color: oklch(0.7 0.17 25);
}

@media (prefers-reduced-motion: reduce) {
  .review-tray {
    transition: none;
  }
  .review-tray-chevron {
    transition: none;
  }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: pre-existing failure on `bottom-toolbar.tsx` (from Task 3–5) — CSS changes don't affect type checks. Do not commit yet.

---

## Task 7: Create `review-tray-styles.ts`

**Files:**
- Create: `src/components/review-tray-styles.ts`

- [ ] **Step 1: Write the style module**

```ts
export const reviewTrayContainer =
  "review-tray pointer-events-auto w-full max-w-[32rem]"
export const reviewTrayHeader = "review-tray-header"
export const reviewTrayHeaderButton = "review-tray-header-button"
export const reviewTrayClip = "review-tray-clip"
export const reviewTrayCount = "review-tray-count"
export const reviewTrayChevron = "review-tray-chevron"
export const reviewTrayBody = "review-tray-body"
export const reviewTrayTextarea = "review-tray-textarea"
export const reviewTrayActions = "review-tray-actions"
export const reviewTraySubmitLabel = "review-tray-submit-label"
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: pre-existing failure on `bottom-toolbar.tsx`. Do not commit yet.

---

## Task 8: Create `ReviewTray` component

**Files:**
- Create: `src/components/review-tray.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useRef } from "react"
import { ChevronDown, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCommentContext } from "@/contexts/comment-context"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChordModShiftCompact } from "@/components/shortcut-glyph-chords"
import {
  reviewTrayActions,
  reviewTrayBody,
  reviewTrayChevron,
  reviewTrayClip,
  reviewTrayContainer,
  reviewTrayCount,
  reviewTrayHeader,
  reviewTrayHeaderButton,
  reviewTraySubmitLabel,
  reviewTrayTextarea,
} from "@/components/review-tray-styles"

export function ReviewTray() {
  const {
    comments,
    summary,
    setSummary,
    isReviewTrayCollapsed,
    setReviewTrayCollapsed,
    submitReview,
    showReviewTray,
  } = useCommentContext()

  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  if (!showReviewTray) return null

  const count = comments.length
  const countLabel = `${count} note${count === 1 ? "" : "s"}`
  const collapsed = isReviewTrayCollapsed

  const handleHeaderClick = () => {
    setReviewTrayCollapsed(!collapsed)
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await submitReview()
    } catch (e) {
      console.error(e)
      toast.error("Failed to copy review")
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div
      className={cn(reviewTrayContainer)}
      data-collapsed={collapsed ? "true" : "false"}
      data-prevent-redlines-dismiss=""
      role="region"
      aria-label="Review"
    >
      <div className={reviewTrayHeader}>
        <button
          type="button"
          className={reviewTrayHeaderButton}
          onClick={handleHeaderClick}
          aria-expanded={!collapsed}
          aria-controls="review-tray-body"
        >
          <Paperclip className={reviewTrayClip} aria-hidden />
          <span>Review</span>
          <span className={reviewTrayCount} aria-label={countLabel}>
            {countLabel}
          </span>
          <ChevronDown className={reviewTrayChevron} aria-hidden />
        </button>
      </div>
      {!collapsed ? (
        <div className={reviewTrayBody} id="review-tray-body">
          <textarea
            ref={textareaRef}
            className={reviewTrayTextarea}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="summary of this review…"
            aria-label="Review summary"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation()
                textareaRef.current?.blur()
              }
            }}
          />
          <div className={reviewTrayActions}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="sticky-skeuo-btn"
                    onClick={() => void handleSubmit()}
                    aria-label="Submit review — copies to clipboard"
                  >
                    <span className={reviewTraySubmitLabel}>Submit review</span>
                  </Button>
                }
              />
              <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
                <span>Submit review</span>
                <Kbd>
                  <ChordModShiftCompact letter="C" />
                </Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: pre-existing failure on `bottom-toolbar.tsx`. Do not commit yet.

---

## Task 9: Remove the Copy button from `BottomToolbar`

**Files:**
- Modify: `src/components/bottom-toolbar.tsx`

- [ ] **Step 1: Rewrite the file without the Copy button**

Replace the entire contents of `src/components/bottom-toolbar.tsx` with:

```tsx
import { useState } from "react"
import { CircleHelp, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommentContext } from "@/contexts/comment-context"
import { ThemeCycleButton } from "@/components/theme-cycle-button"
import { ReviewHelpDialog } from "@/components/review-help-dialog"
import { ReviewSettingsDialog } from "@/components/review-settings-dialog"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChordModShiftAlt } from "@/components/shortcut-glyph-chords"
import { REVIEW_MD_CLEAR_ALL_COMMENTS } from "@/lib/review-md-events"

const toolbarBtnClass =
  "h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full active:scale-[0.97]"

export function BottomToolbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { hasComments } = useCommentContext()

  const requestClearAll = () => {
    window.dispatchEvent(new CustomEvent(REVIEW_MD_CLEAR_ALL_COMMENTS))
  }

  return (
    <>
      <ReviewSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReviewHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div
        className={cn(
          "desk-toolbar pointer-events-auto flex items-center gap-1 px-1.5 py-1 text-popover-foreground",
        )}
        role="toolbar"
        data-prevent-redlines-dismiss=""
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                disabled={!hasComments}
                aria-label="Delete all threads"
                className={toolbarBtnClass}
                onClick={requestClearAll}
              >
                <Trash2 className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
            <span>Delete all threads</span>
            <Kbd>
              <ChordModShiftAlt letter="C" />
            </Kbd>
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          variant="engraved"
          className="mx-1"
        />

        <ThemeCycleButton />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="Settings"
                className={toolbarBtnClass}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            Shortcuts and keyboard layout
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="What is redline?"
                className={toolbarBtnClass}
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            What is redline?
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}
```

Notes: removed the `useEffect`/`useRef` for the copied-check timer, the `Copy`/`CircleCheck` icons, `ChordModShiftCompact` import, the whole Copy tooltip, and the outer `pointer-events-none fixed inset-x-0 bottom-0 z-50` wrapper — positioning moves to the `AppShell` so the tray and toolbar share one fixed container (see Task 10). The toolbar now renders as a bare `desk-toolbar` element; its parent in `AppShell` handles positioning.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean (Tasks 3–8 now all resolve).

- [ ] **Step 3: Commit Tasks 3–5 + 9 together**

Staging: Tasks 3–5 left uncommitted; 6–8 created files but did not commit. Commit all together as one rename-and-rewire change:

```bash
git add src/hooks/use-comments.ts src/contexts/comment-context.tsx src/App.tsx src/components/bottom-toolbar.tsx
git commit -m "refactor: rename copyComments→submitReview, thread summary + tray state through context"
```

Then commit the additive pieces (CSS + styles + component) separately:

```bash
git add src/index.css
git commit -m "feat: add review-tray CSS (paper cover sheet surface)"
git add src/components/review-tray-styles.ts src/components/review-tray.tsx
git commit -m "feat: add ReviewTray component"
```

---

## Task 10: Mount the tray above the toolbar in `AppShell`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import**

Near the other component imports in `src/App.tsx`, add:

```ts
import { ReviewTray } from "@/components/review-tray"
```

- [ ] **Step 2: Replace the single `<BottomToolbar />` line with a fixed container that holds both surfaces**

Find the line `<BottomToolbar />` inside `AppShell` (currently line 429, right before the closing `</div>` of the shell). Replace it with:

```tsx
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Review and quick actions"
      >
        <ReviewTray />
        <BottomToolbar />
      </div>
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: mount ReviewTray above BottomToolbar in AppShell"
```

---

## Task 11: Update the Help dialog shortcut label

**Files:**
- Modify: `src/components/review-help-dialog.tsx`

- [ ] **Step 1: Rename "Copy all" to "Submit review"**

In `src/components/review-help-dialog.tsx`, find the `<Row label="Copy all" ... />` (currently around line 133):

```tsx
              <Row
                label="Submit review"
                keys={
                  <Kbd>
                    <ChordModShiftCompact letter="C" />
                  </Kbd>
                }
              />
```

Also update the "How to use" line (currently line 98–100):

```tsx
            <p className={dialogBody}>
              Select text → thread replies →{" "}
              <span className="font-medium text-foreground/90">Submit review</span>.
            </p>
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/review-help-dialog.tsx
git commit -m "docs: rename Copy all to Submit review in help dialog"
```

---

## Task 12: Manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Start dev server on a sample file**

Run: `REVIEW_MD_FILE=./README.md pnpm dev`

(Any `.md` file in the repo works. Alternatively add `REVIEW_MD_FILE=...` to `.env.local`.)

- [ ] **Step 2: Walk through the scenarios**

Open the URL Vite prints. For each scenario, verify the expected outcome:

1. Fresh load with a file that has no existing comments → toolbar visible, tray hidden.
2. Select text, add a comment → tray slides in above the toolbar, expanded, showing "REVIEW · 1 note", with an empty textarea and the Submit review button.
3. Type a summary, click **Submit review** → toast "Review copied to clipboard". Paste into any editor and confirm the format:
   ```
   Review of `README.md`

   Summary:
   <your text>

   Inline comments:
   > <quoted>
   - <reply>
   ```
4. Click the header strip → tray collapses to just the header row ("REVIEW · 1 note · chevron flipped"). Click again → expands back with summary preserved.
5. With the tray collapsed, press ⌘⇧C → clipboard is updated (same format).
6. Submit with empty summary → output omits the `Summary:` block.
7. Delete all threads via the trash icon → tray disappears. Summary clears. Add another comment → tray reappears expanded with empty summary.
8. Refresh the browser → summary and collapsed flag are restored from localStorage for that file.
9. In another terminal, edit the source markdown file. In the app, trigger the outdated-reload modal and confirm → summary clears alongside comments (this is the `clearAllComments` path).
10. In the textarea, type something and press Esc → textarea blurs but tray stays expanded. No global dismissals fire.
11. Open the Help dialog → shortcut row reads "Submit review", "How to use" mentions "Submit review".

- [ ] **Step 3: Dark mode pass**

Toggle to dark theme (⌘⌥T). Verify the tray surface, textarea, count chip, chevron, and submit label all read cleanly in dark.

- [ ] **Step 4: Screen reader pass (optional but recommended)**

Using VoiceOver on macOS: Tab into the tray; verify the header announces the role + count; the textarea announces "Review summary"; the Submit button announces "Submit review — copies to clipboard".

- [ ] **Step 5: Final typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 6: Build smoke**

Run: `pnpm build`
Expected: Vite build succeeds, CLI bundle succeeds, no errors.

- [ ] **Step 7: Commit any nit fixes**

If the manual pass turned up small issues (copy tweaks, padding), fix and commit with clear messages. Do not batch unrelated fixes.

---

## Open Items (deferred, not part of this plan)

- The prior boundaries-refactor spec (`docs/specs/2026-04-15-proper-boundaries-refactor-design.md`) recommends splitting `use-comments.ts`. This plan does not further grow `use-comments.ts` (new state lives in a sibling hook), but `submitReview` still reads `comments` from inside it. If/when that refactor lands, `submitReview` would likely move to a thin composition layer.
- Animations: no entrance/exit animation spec'd for the tray itself (the CSS uses `transition` on transform/shadow but nothing orchestrates the mount). Adding a fade-in on first appearance is a separate, optional polish task.

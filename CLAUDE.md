# CLAUDE.md

Guidance for Claude / coding agents working on this repo.

## What this is

`@btn0s/redline` — a local-first review tool for markdown files. Spin it up
on a `.md` file (`npx @btn0s/redline ./plan.md`), get a Google-Docs-style
commenting UI on the rendered markdown, and copy all threads back out as
structured text to feed back into an LLM.

The intended primary use case is reviewing LLM-generated plans/specs.

## Layout

```
cli/                Node CLI (entry: cli/index.ts → cli/server.ts)
plugins/            Vite dev plugin that mounts the same /api/file handlers
shared/             API handler helpers shared between dev plugin and CLI
src/                React + Vite SPA (the review UI)
  components/         App components (review-header, comment-sidebar, editor, dialogs, etc.)
    ui/               shadcn-ish primitives (don't hand-edit unless necessary)
  contexts/           CommentContext, ShortcutSchemeContext, ThemeProvider
  extensions/         Tiptap extensions (CommentMark, CommentShortcuts)
  hooks/              useFile, useComments, useEditorCommentSync, useCommentSidebarLayout, ...
  lib/                Pure utilities (comment-anchoring, format-shortcut, mod-key, utils)
  types/              Shared TS types (Comment)
  index.css           Theme tokens + .tiptap document styles + redline annotation styles
scripts/build-cli.js  esbuild bundle for the CLI
skills/redline/       Agent skill shipped with the package
docs/specs/           Design specs / plans (sometimes referenced from prompts)
```

The dev experience and the production CLI talk to the same `/api/file`
contract. Keep `plugins/review-md-dev-api.ts` and `cli/server.ts` in sync,
and prefer pushing logic into `shared/api-handlers.ts` so both code paths
get it for free.

## Commands

```bash
pnpm dev          # vite dev server (set REVIEW_MD_FILE=path/to/foo.md in .env.local for the dev API)
pnpm build        # tsc -b && vite build && bundle CLI into dist/cli/index.js
pnpm typecheck    # tsc -b
pnpm lint         # eslint .
pnpm format       # prettier --write **/*.{ts,tsx}
pnpm redline      # build + run dist/cli/index.js (smoke-test the published binary)
```

Always run `pnpm exec tsc --noEmit` (or `pnpm typecheck`) and `pnpm lint`
on touched files before considering work done.

## Conventions

- **TypeScript strict, ESM-only.** Vite + React 19 + Tiptap 3.
- **Tailwind v4.** Theme tokens live in `src/index.css` (`:root` and `.dark`).
  Use the existing `--annotation-*`, `--editor-*`, and shadcn tokens —
  don't hand-mix raw color values in components.
- **shadcn primitives** under `src/components/ui` — treat as semi-frozen.
  Compose, don't fork.
- **Imports at top of file.** No dynamic/inline `import()` for ergonomics
  (workspace rule: `no-inline-imports`).
- **Exhaustive switches** for unions and enums (workspace rule:
  `typescript-exhaustive-switch`). Use `: never` defaults so adding a
  case is a compile error elsewhere.
- **No comments narrating obvious code.** Comments should explain
  non-obvious intent or trade-offs only.
- **No emojis** in code, comments, or commit messages unless explicitly
  requested by the user.
- **Prettier:** no semis, double quotes, 2-space indent, 80 col,
  `prettier-plugin-tailwindcss` sorts class names. Don't fight it.
- **Path alias:** `@/*` → `src/*`.

## Architecture notes

### Comments
- `Comment` shape lives in `src/types/comment.ts`.
- `CommentContext` (`src/contexts/comment-context.tsx`) owns the canonical
  comment list, persistence (`useComments`), hover state, draft state.
  Persistence key is per-file (`file.path ?? file.filename`).
- `CommentMark` is a Tiptap mark (`src/extensions/comment-mark.ts`)
  storing the comment id as an attribute. The DOM is `<mark class="comment-mark">`.
- `useEditorCommentSync` reconciles editor marks ↔ context state when
  content changes (e.g. reload from disk, undo).
- `useCommentSidebarLayout` does the Google-Docs-style anchored layout:
  measures each `mark.comment-mark`'s position, forward-stacks cards
  with a gap, and synchronizes the sidebar's `min-height` with the
  editor's content height (no internal sidebar scroll — the page scrolls).

### Editor
- Tiptap with StarterKit + tiptap-markdown + CommentMark + CommentShortcuts.
- Markdown is the source of truth; `tiptap-markdown` round-trips it.
- `spellcheck` is forced **off** at the editor level — the native red
  squiggle conflicts with the redline annotation underline. Don't
  reintroduce a toggle for it.

### Redline annotation underline
- Painted via a `::before` on `mark.comment-mark` using
  `mask-image: var(--annotation-squiggle-mask)` tiled at native 53×6.
- `mask-repeat: repeat-x; mask-size: 53px 6px` — wave wavelength is
  constant regardless of selection length.
- Hover/active "pop" is a `translateY(-0.5px)` lift + opacity to 1, never
  a horizontal scale (would overshoot the text box).
- Known limitation: marks that wrap across lines render one underline
  rectangle under the bounding box, not per-line, because the mark is
  `display: inline-block`. Fixing that requires switching to inline +
  `box-decoration-break: clone` + a tinted inline-SVG background image
  (mask can't be applied per-layer).

### File API
- `GET /api/file` → `{ content, filename, path, root }`.
  - `path`: POSIX-style relative to cwd (display).
  - `root`: basename of the nearest git repo root (walks up from the
    file's dir looking for `.git`), or basename of the file's parent
    folder if not in a repo. Used for the header breadcrumb.
- `GET /api/file/meta` → `{ mtimeMs, size, rev }` (rev = sha256 of
  `mtimeMs:size`, used for outdated detection).
- `PUT /api/file` → `{ content: string }`.

## Releases

This project releases via git tags + `pnpm publish` (manual). Steps:

1. Make logical, focused commits on `main`.
2. Bump `version` in `package.json`.
3. `git commit -m "chore: release vX.Y.Z"`.
4. `git tag -a vX.Y.Z -m "..."` with a multi-line annotated message
   summarizing what's in the release (use `git log` since the previous
   tag).
5. `git push origin main && git push origin vX.Y.Z`.
6. (Optional, only when the user asks) `pnpm release` to publish to npm.

**Do not** run a release unless the user explicitly asks for one.
"Commit and push" ≠ "release". The `review-and-ship` skill will say
`(tag release)` when a release is wanted.

## Things to avoid

- Reintroducing browser-spellcheck UI or toggles (intentionally removed).
- Adding a separate scroll container inside the comment sidebar (it's
  designed to share the page scroller; sidebar `min-height` matches the
  editor).
- Editing files inside `src/components/ui/` unless the user asks for it.
- Committing `.env.local`, `dist/`, or `node_modules/`.
- Using `--no-verify` or amending pushed commits.
- Generating new files when an existing file is the right home.

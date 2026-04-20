# Review Submit Tray — Design Spec

## Problem

Today, "finishing a review" in Redline is a single icon button on the bottom toolbar (Copy). It formats the threads into a prompt and writes to the clipboard. That works, but it flattens a deliberate act (wrapping up a review, framing it for the LLM) into a passive copy. There is no place to leave overall feedback — only per-passage threads.

The ask: push "review mode" further. Borrow GitHub's PR review submit UX — a summary field and a labeled submit — in Redline's paper/skeuomorphic voice.

## Goal

A persistent "review cover sheet" tray above the bottom toolbar that owns:

1. A summary textarea (overall review notes).
2. A single **Submit review** action that copies summary + inline threads to the clipboard, formatted as a review.
3. A visible comment count and a collapsible affordance for times when the tray is in the way.

The existing toolbar Copy icon is retired; the `⌘⇧C` shortcut is remapped to the tray's Submit.

## Non-goals

- Multiple verdicts (Approve / Comment / Request changes). Single neutral verdict only.
- Any server-side "submit" behavior. Clipboard remains the sole output channel.
- Clearing or resolving comments on submit. Submitting is non-destructive — user manages threads independently.
- Replacing per-thread workflow. Individual thread reply/edit/delete is unchanged.

## UX

### States

The tray has three observable states, driven entirely by the comment list and a per-file collapsed flag:

| State | When | What renders |
|---|---|---|
| **Hidden** | `comments.length === 0` | Nothing. Toolbar renders alone (today's layout). |
| **Expanded** | `comments.length >= 1` and not collapsed | Full tray: header strip + summary textarea + Submit button. |
| **Collapsed** | `comments.length >= 1` and collapsed | Header strip only: label + count + chevron. Click strip or chevron to expand. |

Transitions: hidden → expanded happens automatically the first time a comment is added. Expanded ↔ collapsed is user-driven (chevron click). There is no "dismiss entirely" affordance; clearing all comments is the escape hatch (and that flow already exists).

### Layout

The tray lives in the same fixed-bottom container as the toolbar, stacked above it. Both share the paper/skeuomorphic visual language (`desk-toolbar`, `sticky-note`, `paper-stamp`). The tray is wider than the toolbar pill — it needs a legible textarea — but anchored to the same horizontal center.

Mobile (< 640px): the tray takes near-full width, minus safe-area insets. Textarea is ~3 rows.

Desktop: the tray caps at ~32rem width. Textarea is ~3 rows, grows to ~6 on focus.

The page's bottom padding already reserves `3.5rem` for the toolbar. With the tray visible, the reserved space grows (measured from the tray's height). The review-header and page scroll stay unaffected.

### Visual treatment ("review cover sheet")

- Paper-note surface: reuses `sticky-note` styles (subtle paper grain, drop shadow, faint color wash). Slight static rotation (`--sticky-rotate: -0.6deg`) so it reads as a physical note clipped to the bottom of the page.
- Header strip: small-caps "REVIEW", comment count chip (`N note${plural}`), right-aligned chevron. A purely decorative paper-clip glyph sits on the leading edge of the strip — visual-only, no interaction. The strip itself is the click target in collapsed state.
- Textarea: borderless, paper-colored, typewriter-adjacent typography (reuses `.sticky-handwritten` family where available). Placeholder: `summary of this review…`.
- Submit button: reuses `sticky-skeuo-btn` family with a distinct "stamp" accent — think red rubber-stamp color on the label only, not the surface. Label: **Submit review**. Disabled only while a submit is in flight (prevents double-click). Tray visibility already gates zero-comment cases.
- Count badge: compact pill reading "N note" or "N notes".

### Behavior

- **Submit action.** Composes the review prompt (see Output Format), writes to clipboard, shows a success toast (`Review copied`). The Copy icon's current success check animation translates onto the Submit button (check glyph momentarily replaces stamp glyph). No state is cleared. Summary stays, threads stay, tray stays expanded.
- **Summary persistence.** Summary text is persisted per-file, same lifecycle as comments. When the file is closed or switched, summary clears for that file until next visit. Cleared when the document is reloaded from disk (same hook as `clearAllComments` in `confirmOutdatedReload`).
- **Collapsed flag persistence.** Per-file, same storage family. Expanding/collapsing is local state; the flag sticks.
- **Keyboard shortcut.** `⌘⇧C` (today: Copy) fires Submit. Disabled when tray is hidden (no comments). Works from collapsed state too — no need to expand first. Existing guard rails (`shouldBlockReviewChromeShortcut`) still apply.
- **Esc.** Focused textarea: Esc blurs the textarea but does not collapse the tray. No other Esc semantics change.

## Output Format

```
Review of `<file>`

Summary:
<user's summary text, trimmed; omitted if empty>

Inline comments:
> <quoted passage>
- <thread reply>
- <thread reply>

> <quoted passage>
- <thread reply>
```

Changes from today's output:

- Header: `Review of \`<file>\`` (was: `Feedback on \`<file>\``, plus a preamble sentence).
- The preamble sentence (`Review comments below. Each block quotes a passage from the file, then lists the notes for that passage.`) is removed. The structure is self-documenting now that it has sections.
- New `Summary:` section, only rendered when the trimmed summary is non-empty.
- Threads are gathered under an `Inline comments:` heading.

If the summary is empty and there are threads: output has `Review of …` + `Inline comments:` + threads.

If there are zero threads: the tray is hidden so Submit is unreachable — no special-case handling needed.

## Architecture

### State ownership

Extend the existing `CommentContext` / `useComments` rather than introducing a parallel provider. The summary, collapsed flag, and submit action belong to the same "this file's feedback" concept as comments and share the same persistence key family and lifecycle.

New context surface (added to `CommentContextValue`):

```ts
summary: string
setSummary: (next: string) => void
isReviewTrayCollapsed: boolean
setReviewTrayCollapsed: (next: boolean) => void
submitReview: () => Promise<boolean>  // replaces copyComments at call sites
```

`copyComments` is renamed `submitReview` and its formatter updated. No call site should retain the old name — there is exactly one today (`bottom-toolbar.tsx`'s Copy button, which is being removed) plus the event listener in `AppCommandListeners` and the typed context field. All three change together.

### Persistence

| Key prefix | Payload | Notes |
|---|---|---|
| `review-md:comments:v1:<file>` | `{ comments, activeCommentId }` | Unchanged. |
| `review-md:review:v1:<file>` | `{ summary: string, trayCollapsed: boolean }` | New. Single blob per file for the tray. |

Persistence is debounced the same way as comments (500ms). `use-comments.ts` grows a mirror of its existing persistence scaffolding for the review blob — same shape, same lifecycle, same "load on mount / load on key change" pattern. (See Open Questions for whether this warrants a new hook.)

### Components

New:
- `src/components/review-tray.tsx` — the tray UI. Consumes `useCommentContext` for `comments.length`, `summary`, `setSummary`, `isReviewTrayCollapsed`, `setReviewTrayCollapsed`, `submitReview`. No props.
- `src/components/review-tray-styles.ts` — shared Tailwind class strings (surface, header, textarea, submit button), following the pattern of `review-dialog-styles.ts`.

Changed:
- `src/components/bottom-toolbar.tsx` — remove Copy button + its copied-check animation + `hasComments` dependency for it + the `copyComments` wiring. Keep Delete, Theme, Settings, Help. The bar gets narrower.
- `src/contexts/comment-context.tsx` — thread new fields/actions through.
- `src/hooks/use-comments.ts` — add summary + collapsed state + persistence, rename `copyComments` → `submitReview`, rename `formatComments` → `formatReview(summary)`, update the formatter.
- `src/App.tsx` — in `AppShell`, mount `<ReviewTray />` above `<BottomToolbar />`. Update `AppCommandListeners` so `REVIEW_MD_COPY_COMMENTS` → `REVIEW_MD_SUBMIT_REVIEW` (rename the event constant) and the handler calls `submitReview`.
- `src/lib/review-md-events.ts` — rename `REVIEW_MD_COPY_COMMENTS` → `REVIEW_MD_SUBMIT_REVIEW`.
- `src/components/review-help-dialog.tsx` — shortcut row label "Copy all" → "Submit review"; tooltip/aria copy on the shortcut chip updated accordingly.
- `src/index.css` — add `.review-tray` surface class in the same section as `.desk-toolbar` and `.sticky-note`. Extends sticky-note motifs (grain, shadow, rotation) but is not a literal sticky note — it's a flat-ish cover sheet with a paper clip or tape accent.

Removed:
- The toolbar Copy button + its check-animation markup (lives only in `bottom-toolbar.tsx`).

### Control flow

```
Editor mark ──┐
              ├── useComments ──┬── comments, hasComments
              │                 ├── summary, setSummary  (new)
              │                 ├── isReviewTrayCollapsed, setReviewTrayCollapsed  (new)
              │                 ├── submitReview (new; replaces copyComments)
              │                 └── clearAllComments (clears comments + summary)
              │
CommentContext ─────────────────┘
   │
   ├── ReviewTray  (new; subscribes to all of the above)
   ├── CommentSidebar  (unchanged)
   ├── BottomToolbar  (Copy button removed)
   └── AppCommandListeners
         └── ⌘⇧C → REVIEW_MD_SUBMIT_REVIEW → submitReview()
```

### Formatter

```ts
function formatReview(
  summary: string,
  comments: Comment[],
  fileLabel: string,
): string {
  const header = `Review of \`${fileLabel}\``

  const summaryBlock = summary.trim()
    ? ["Summary:", summary.trim()].join("\n")
    : null

  const threadsBlock = comments.length
    ? [
        "Inline comments:",
        comments
          .map((c) => `> ${c.quotedText}\n${c.messages.map((m) => `- ${m.body}`).join("\n")}`)
          .join("\n\n"),
      ].join("\n")
    : null

  return [header, summaryBlock, threadsBlock].filter(Boolean).join("\n\n")
}
```

### Edge cases

- **File switch.** `useComments` already handles persistence key change by reloading comments. The new review blob follows the same pattern: reload summary + collapsed flag on key change; reset if no persistence key.
- **Reload from disk.** `confirmOutdatedReload` in `App.tsx` calls `clearAllComments`. We extend `clearAllComments` to also clear the summary, keeping the behavior "reloading the file resets the review".
- **Draft summary + clear all threads.** Clearing all threads via the existing Clear dialog hides the tray. The summary text clears along with it (same lifecycle — the review is scoped to the feedback, not to the empty file). The collapsed flag resets to `false`.
- **Empty summary, empty threads.** Tray is hidden (no threads). Submit unreachable. No output produced.
- **Submit with empty summary, ≥1 threads.** Permitted. Output omits the `Summary:` block.

## Testing

Manual smoke tests after implementation:

1. Open a file, add 1 comment — tray appears expanded below threads; toolbar remains.
2. Add summary text, click Submit — clipboard contains the new format.
3. Click Submit with empty summary — clipboard omits summary block.
4. Collapse tray — only header strip visible, count correct. Expand again.
5. Collapse tray, `⌘⇧C` — clipboard contains review (still works while collapsed).
6. Clear all threads — tray disappears; re-adding a thread brings it back with empty summary and expanded.
7. Switch files (if available via future CLI flows) or simulate by clearing localStorage for another path — summary is file-scoped.
8. Reload from disk (trigger outdated modal with file edit) — summary clears alongside comments.
9. Type in textarea, press Esc — textarea blurs, tray stays expanded.
10. Screen reader pass: header strip announces "Review, N notes, collapsed/expanded"; Submit announces "Submit review, N notes ready"; textarea has accessible label.

Plus:
- `pnpm typecheck`.
- `pnpm lint`.

## Open Questions

1. **Separate hook for review state?** `use-comments.ts` is already 300 lines and does persistence + domain + editor + clipboard (per the prior boundaries-refactor spec). Adding summary + collapsed persistence risks compounding that. Candidate: factor a small `use-review-state.ts` hook owned by `CommentProvider`, returning `{ summary, setSummary, isReviewTrayCollapsed, setReviewTrayCollapsed }`, leaving `useComments` to own only comment state. `submitReview` stays in `useComments` since it reads comments to format. The plan step can choose.
2. **CSS class namespace.** `.review-tray` vs. fitting under a new `.review-cover-sheet` class. Cosmetic; plan picks.

## Alignment with repo conventions

- No new deps. Uses existing Tiptap/React/shadcn surface.
- Reuses theme tokens (`--annotation-*`, sticky-note variables). No raw colors.
- Strict TS, ESM, exhaustive switches not needed (no new unions).
- No browser-spellcheck regressions — textarea is a normal `<textarea>`, spellcheck is a separate concern (left as default for plain-text note input, which the repo allows outside the editor).
- No new scroll container in the sidebar (unrelated).
- Commit style + no emojis: honored.

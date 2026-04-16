/** True on macOS / iOS (primary modifier is ⌘). */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
    /Mac OS/i.test(navigator.userAgent)
  )
}

/**
 * Primary “command” modifier: ⌘ on Apple platforms, Ctrl elsewhere.
 * Matches TipTap / ProseMirror `Mod-` behavior.
 */
export function isModKey(e: { metaKey: boolean; ctrlKey: boolean }): boolean {
  return isApplePlatform() ? e.metaKey : e.ctrlKey
}

/** Human-readable primary modifier label for shortcuts UI. */
export function modLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl"
}

/**
 * Redlines toggle (⌘⇧L): do not steal from the editor or real text fields.
 */
export function shouldBlockRedlinesToggle(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(".ProseMirror")) return true
  return Boolean(
    target.closest("textarea, input, select") || target.isContentEditable,
  )
}

/**
 * Theme / destructive chords: allow in the main editor; block in side UI fields.
 */
export function shouldBlockReviewChromeShortcut(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(".ProseMirror")) return false
  return Boolean(
    target.closest("textarea, input, select") || target.isContentEditable,
  )
}

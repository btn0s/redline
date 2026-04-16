import { modLabel } from "@/lib/mod-key"
import type { ShortcutScheme } from "@/lib/shortcut-scheme"

/** e.g. ⌘⌥M */
export function modAltKeyCompact(letter: string): string {
  const m = modLabel()
  if (m === "⌘") return `⌘⌥${letter}`
  return `${m}+Alt+${letter}`
}

/** e.g. ⌘⇧M */
export function modShiftKeyCompact(letter: string): string {
  const m = modLabel()
  if (m === "⌘") return `⌘⇧${letter}`
  return `${m}+Shift+${letter}`
}

export function modShiftAltKey(letter: string): string {
  return `${modLabel()}+Shift+Alt+${letter}`
}

export function modAltKey(letter: string): string {
  return `${modLabel()}+Alt+${letter}`
}

export function addCommentShortcutDisplay(scheme: ShortcutScheme): string {
  return scheme === "google-docs"
    ? modAltKeyCompact("M")
    : modShiftKeyCompact("M")
}

import { modLabel } from "@/lib/mod-key"

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

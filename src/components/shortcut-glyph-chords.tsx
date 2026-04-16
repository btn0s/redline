import type { ShortcutScheme } from "@/lib/shortcut-scheme"
import { isApplePlatform, modLabel } from "@/lib/mod-key"

/**
 * Apple: flat text chords like `⌘+Shift+C` — Unicode ⌘ + words (Shift/Alt) + `+`
 * so modifier names match body text weight (avoids thin ⇧ / mixed icon SVGs).
 * Non-Apple: `Ctrl+Shift+…` style.
 */

const CMD = "\u2318"

/** ⌘+Alt + letter (e.g. new comment Google Docs, theme) */
export function ChordModAltCompact({ letter }: { letter: string }) {
  if (!isApplePlatform()) {
    return <span>{`${modLabel()}+Alt+${letter}`}</span>
  }
  return (
    <span aria-label={`Command Alt ${letter}`}>
      {CMD}+Alt+{letter}
    </span>
  )
}

/** ⌘+Shift + letter */
export function ChordModShiftCompact({ letter }: { letter: string }) {
  if (!isApplePlatform()) {
    return <span>{`${modLabel()}+Shift+${letter}`}</span>
  }
  return (
    <span aria-label={`Command Shift ${letter}`}>
      {CMD}+Shift+{letter}
    </span>
  )
}

/** ⌘+Shift+Alt + letter */
export function ChordModShiftAlt({ letter }: { letter: string }) {
  if (!isApplePlatform()) {
    return <span>{`${modLabel()}+Shift+Alt+${letter}`}</span>
  }
  return (
    <span aria-label={`Command Shift Alt ${letter}`}>
      {CMD}+Shift+Alt+{letter}
    </span>
  )
}

export function ChordNewCommentShortcut({ scheme }: { scheme: ShortcutScheme }) {
  return scheme === "google-docs" ? (
    <ChordModAltCompact letter="M" />
  ) : (
    <ChordModShiftCompact letter="M" />
  )
}

export const SHORTCUT_SCHEME_STORAGE_KEY = "redline-shortcut-scheme-v1"

export type ShortcutScheme = "google-docs" | "notion"

export function parseShortcutScheme(raw: string | null): ShortcutScheme {
  if (raw === "notion") return "notion"
  return "google-docs"
}

import { parseShortcutScheme, SHORTCUT_SCHEME_STORAGE_KEY } from "@/lib/shortcut-scheme"

function readInitialScheme(): ShortcutScheme {
  if (typeof localStorage === "undefined") return "google-docs"
  return parseShortcutScheme(localStorage.getItem(SHORTCUT_SCHEME_STORAGE_KEY))
}

/** TipTap `CommentShortcuts` reads this; the provider syncs it when the user changes settings. */
export const shortcutSchemeRef = { current: readInitialScheme() }

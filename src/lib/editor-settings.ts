export const SPELLCHECK_STORAGE_KEY = "redline-editor-spellcheck-v1"

export const DEFAULT_SPELLCHECK_ENABLED = false

export function parseSpellcheckEnabled(raw: string | null): boolean {
  if (raw === "true") return true
  if (raw === "false") return false
  return DEFAULT_SPELLCHECK_ENABLED
}

/** Persists whether the comment threads sidebar is open, per reviewed file. */

const STORAGE_PREFIX = "review-md:comments-panel:v1:"

function storageKey(fileKey: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(fileKey)}`
}

/** `null` = no saved preference (caller picks the default). */
export function loadCommentsPanelOpen(fileKey: string | null): boolean | null {
  if (!fileKey || typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(storageKey(fileKey))
    if (raw === "true") return true
    if (raw === "false") return false
    return null
  } catch {
    return null
  }
}

export function saveCommentsPanelOpen(fileKey: string | null, open: boolean): void {
  if (!fileKey || typeof localStorage === "undefined") return
  try {
    localStorage.setItem(storageKey(fileKey), open ? "true" : "false")
  } catch {
    // ignore quota / private mode
  }
}

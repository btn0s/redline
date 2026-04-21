import { useCallback, useEffect, useState } from "react"

const STORAGE_PREFIX = "review-md:review:v1:"

interface PersistedReview {
  summary: string
}

function storageKey(fileKey: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(fileKey)}`
}

function loadPersisted(fileKey: string): PersistedReview {
  try {
    const raw = localStorage.getItem(storageKey(fileKey))
    if (!raw) return { summary: "" }
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== "object") {
      return { summary: "" }
    }
    const obj = data as Record<string, unknown>
    return {
      summary: typeof obj.summary === "string" ? obj.summary : "",
    }
  } catch {
    return { summary: "" }
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function savePersisted(fileKey: string, value: PersistedReview) {
  if (saveTimeout !== null) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(storageKey(fileKey), JSON.stringify(value))
    } catch {
      // quota / private mode
    }
  }, 500)
}

function initial(persistenceKey: string | null): {
  summary: string
  loadedKey: string | null
} {
  if (!persistenceKey) {
    return { summary: "", loadedKey: null }
  }
  const persisted = loadPersisted(persistenceKey)
  return { ...persisted, loadedKey: persistenceKey }
}

export function useReviewState(persistenceKey: string | null) {
  const [seed] = useState(() => initial(persistenceKey))
  const [summary, setSummaryState] = useState(seed.summary)
  const [loadedKey, setLoadedKey] = useState(seed.loadedKey)

  useEffect(() => {
    if (!persistenceKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persistence key cleared
      setSummaryState("")
      setLoadedKey(null)
      return
    }
    const next = loadPersisted(persistenceKey)
    setSummaryState(next.summary)
    setLoadedKey(persistenceKey)
  }, [persistenceKey])

  useEffect(() => {
    if (!persistenceKey || loadedKey !== persistenceKey) return
    savePersisted(persistenceKey, { summary })
  }, [persistenceKey, loadedKey, summary])

  const setSummary = useCallback((next: string) => {
    setSummaryState(next)
  }, [])

  const resetReview = useCallback(() => {
    setSummaryState("")
  }, [])

  return {
    summary,
    setSummary,
    resetReview,
  }
}

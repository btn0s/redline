import { useCallback, useEffect, useState } from "react"

const STORAGE_PREFIX = "review-md:review:v1:"

interface PersistedReview {
  summary: string
  trayCollapsed: boolean
}

function storageKey(fileKey: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(fileKey)}`
}

function loadPersisted(fileKey: string): PersistedReview {
  try {
    const raw = localStorage.getItem(storageKey(fileKey))
    if (!raw) return { summary: "", trayCollapsed: false }
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== "object") {
      return { summary: "", trayCollapsed: false }
    }
    const obj = data as Record<string, unknown>
    return {
      summary: typeof obj.summary === "string" ? obj.summary : "",
      trayCollapsed:
        typeof obj.trayCollapsed === "boolean" ? obj.trayCollapsed : false,
    }
  } catch {
    return { summary: "", trayCollapsed: false }
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
  trayCollapsed: boolean
  loadedKey: string | null
} {
  if (!persistenceKey) {
    return { summary: "", trayCollapsed: false, loadedKey: null }
  }
  const persisted = loadPersisted(persistenceKey)
  return { ...persisted, loadedKey: persistenceKey }
}

export function useReviewState(persistenceKey: string | null) {
  const [seed] = useState(() => initial(persistenceKey))
  const [summary, setSummaryState] = useState(seed.summary)
  const [trayCollapsed, setTrayCollapsedState] = useState(seed.trayCollapsed)
  const [loadedKey, setLoadedKey] = useState(seed.loadedKey)

  useEffect(() => {
    if (!persistenceKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persistence key cleared
      setSummaryState("")
      setTrayCollapsedState(false)
      setLoadedKey(null)
      return
    }
    const next = loadPersisted(persistenceKey)
    setSummaryState(next.summary)
    setTrayCollapsedState(next.trayCollapsed)
    setLoadedKey(persistenceKey)
  }, [persistenceKey])

  useEffect(() => {
    if (!persistenceKey || loadedKey !== persistenceKey) return
    savePersisted(persistenceKey, { summary, trayCollapsed })
  }, [persistenceKey, loadedKey, summary, trayCollapsed])

  const setSummary = useCallback((next: string) => {
    setSummaryState(next)
  }, [])

  const setTrayCollapsed = useCallback((next: boolean) => {
    setTrayCollapsedState(next)
  }, [])

  const resetReview = useCallback(() => {
    setSummaryState("")
    setTrayCollapsedState(false)
  }, [])

  return {
    summary,
    setSummary,
    isReviewTrayCollapsed: trayCollapsed,
    setReviewTrayCollapsed: setTrayCollapsed,
    resetReview,
  }
}

import { useState, useEffect, useCallback, useRef } from "react"

interface FileData {
  content: string
  filename: string
}

export function useFile() {
  const [file, setFile] = useState<FileData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    setLoadError(null)
    void fetch("/api/file")
      .then(async (r) => {
        const text = await r.text()
        let data: unknown
        try {
          data = text.trim() === "" ? null : JSON.parse(text)
        } catch {
          throw new Error(
            r.ok
              ? "Invalid JSON from /api/file (empty or non-JSON body)."
              : `Server error (${r.status}): ${text.slice(0, 120) || "empty response"}`,
          )
        }
        if (!r.ok && data && typeof data === "object" && data !== null && "error" in data) {
          throw new Error(String((data as { error: unknown }).error))
        }
        if (!r.ok) {
          throw new Error(r.statusText || "Failed to load file")
        }
        if (
          !data ||
          typeof data !== "object" ||
          !("content" in data) ||
          !("filename" in data)
        ) {
          throw new Error("Invalid response from /api/file")
        }
        setFile(data as FileData)
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load file")
      })
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const save = useCallback((content: string) => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setSaving(true)
      await fetch("/api/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      setSaving(false)
    }, 500)
  }, [])

  return { file, save, saving, loadError }
}

import { useState, useEffect, useCallback, useRef } from "react"

interface FileData {
  content: string
  filename: string
}

export function useFile() {
  const [file, setFile] = useState<FileData | null>(null)
  const [saving, setSaving] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    void fetch("/api/file")
      .then((r) => r.json())
      .then(setFile)
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

  return { file, save, saving }
}

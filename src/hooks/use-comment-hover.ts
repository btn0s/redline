import { useCallback, useEffect, useState } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"

export function useCommentHover(editor: TiptapEditor | null): {
  hoveredCommentId: string | null
  clearHover: () => void
} {
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const clearHover = useCallback(() => setHoveredCommentId(null), [])

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const syncHotMark = () => {
      const hot = hoveredCommentId
      dom.querySelectorAll("mark.comment-mark[data-comment-id]").forEach((node) => {
        const el = node as HTMLElement
        const id = el.getAttribute("data-comment-id")
        if (hot && id === hot) {
          el.classList.add("comment-mark--hot")
        } else {
          el.classList.remove("comment-mark--hot")
        }
      })
    }
    syncHotMark()
  }, [editor, hoveredCommentId])

  useEffect(() => {
    if (!editor) return
    const editorDom = editor.view.dom
    const onMove = (e: PointerEvent) => {
      const t = e.target
      if (!(t instanceof Element) || !t.closest) return
      let next: string | null = null
      if (t.closest("[data-redlines-sidebar]")) {
        const row = t.closest("[data-comment-thread-id]")
        next = row?.getAttribute("data-comment-thread-id") ?? null
      } else if (editorDom.contains(t)) {
        const mark = t.closest("mark.comment-mark[data-comment-id]")
        next = mark?.getAttribute("data-comment-id") ?? null
      }
      setHoveredCommentId((prev) => (prev === next ? prev : next))
    }
    document.addEventListener("pointermove", onMove, { passive: true })
    return () => document.removeEventListener("pointermove", onMove)
  }, [editor])

  return { hoveredCommentId, clearHover }
}

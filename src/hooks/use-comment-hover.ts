import { useCallback, useEffect, useRef, useState } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { setHoveredComment } from "@/extensions/comment-mark"

export function useCommentHover(editor: TiptapEditor | null): {
  hoveredCommentId: string | null
  clearHover: () => void
} {
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const clearHover = useCallback(() => {
    setHoveredCommentId(null)
    if (editor) setHoveredComment(editor, null)
  }, [editor])

  const pendingRaf = useRef(false)
  const latestTarget = useRef<Element | null>(null)

  useEffect(() => {
    if (!editor) return
    const editorDom = editor.view.dom

    const processHover = () => {
      pendingRaf.current = false
      const t = latestTarget.current
      if (!t) return

      let next: string | null = null
      if (t.closest("[data-redlines-sidebar]")) {
        const row = t.closest("[data-comment-thread-id]")
        next = row?.getAttribute("data-comment-thread-id") ?? null
      } else if (editorDom.contains(t)) {
        const mark = t.closest("mark.comment-mark[data-comment-id]")
        next = mark?.getAttribute("data-comment-id") ?? null
      }

      setHoveredCommentId((prev) => {
        if (prev === next) return prev
        setHoveredComment(editor, next)
        return next
      })
    }

    const onMove = (e: PointerEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      latestTarget.current = t
      if (!pendingRaf.current) {
        pendingRaf.current = true
        requestAnimationFrame(processHover)
      }
    }

    document.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      document.removeEventListener("pointermove", onMove)
      if (pendingRaf.current) {
        pendingRaf.current = false
      }
    }
  }, [editor])

  return { hoveredCommentId, clearHover }
}

import { useEffect } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/hooks/use-comments"
import {
  normalizeQuotedText,
  resolveCommentRange,
  resolveCommentRangeNearAnchor,
} from "@/lib/comment-anchoring"

/** Bottom strip of the comment mark hit target for opening the thread (see CSS). */
const PILL_CLICK_ZONE_PX = 8

interface UseEditorCommentSyncOptions {
  editor: TiptapEditor | null
  comments: Comment[]
  syncCommentAnchorsFromEditor: (editor: TiptapEditor) => void
  setActiveCommentId: (id: string | null) => void
  setShowNewComment: (show: boolean) => void
}

export function useEditorCommentSync({
  editor,
  comments,
  syncCommentAnchorsFromEditor,
  setActiveCommentId,
  setShowNewComment,
}: UseEditorCommentSyncOptions): void {
  useEffect(() => {
    if (!editor || comments.length === 0) return
    const commentMarkType = editor.state.schema.marks.commentMark
    if (!commentMarkType) return

    const existingCommentMarkIds = new Set<string>()
    editor.state.doc.descendants((node) => {
      node.marks.forEach((mark) => {
        if (
          mark.type.name === "commentMark" &&
          typeof mark.attrs.commentId === "string"
        ) {
          existingCommentMarkIds.add(mark.attrs.commentId)
        }
      })
    })

    const missingComments = comments.filter(
      (comment) => !existingCommentMarkIds.has(comment.id),
    )
    if (missingComments.length === 0) return

    let tr = editor.state.tr
    let changed = false

    for (const comment of missingComments) {
      const anchoredRange = resolveCommentRange(editor, comment)
      const anchoredText = anchoredRange
        ? normalizeQuotedText(
            editor.state.doc.textBetween(anchoredRange.from, anchoredRange.to, " "),
          )
        : ""
      const quote = normalizeQuotedText(comment.quotedText)
      const range =
        anchoredRange && anchoredText === quote
          ? anchoredRange
          : resolveCommentRangeNearAnchor(editor, comment) ?? anchoredRange
      if (!range) continue
      tr = tr.addMark(
        range.from,
        range.to,
        commentMarkType.create({ commentId: comment.id }),
      )
      changed = true
    }

    if (!changed) return
    tr.setMeta("addToHistory", false)
    editor.view.dispatch(tr)
  }, [editor, comments])

  useEffect(() => {
    if (!editor) return
    const syncAnchors = () => syncCommentAnchorsFromEditor(editor)
    syncAnchors()
    editor.on("update", syncAnchors)
    return () => {
      editor.off("update", syncAnchors)
    }
  }, [editor, syncCommentAnchorsFromEditor])

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const onPillClick = (event: MouseEvent) => {
      let el = event.target as HTMLElement | null
      while (el && el !== dom) {
        if (el.matches("mark.comment-mark[data-comment-id]")) {
          const rect = el.getBoundingClientRect()
          if (event.clientY >= rect.bottom - PILL_CLICK_ZONE_PX) {
            const commentId = el.getAttribute("data-comment-id")
            if (!commentId) return
            const hasSavedThread = comments.some((c) => c.id === commentId)
            if (commentId.startsWith("draft-") && !hasSavedThread) return
            event.preventDefault()
            event.stopPropagation()
            setActiveCommentId(commentId)
            setShowNewComment(false)
          }
          return
        }
        el = el.parentElement
      }
    }

    dom.addEventListener("click", onPillClick, true)
    return () => dom.removeEventListener("click", onPillClick, true)
  }, [editor, setActiveCommentId, setShowNewComment, comments])
}

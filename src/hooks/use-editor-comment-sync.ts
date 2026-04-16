import { useEffect, useLayoutEffect, useRef } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/types/comment"
import { forEachCommentMark } from "@/lib/editor-utils"
import {
  normalizeQuotedText,
  resolveCommentRange,
  resolveCommentRangeNearAnchor,
} from "@/lib/comment-anchoring"

interface UseEditorCommentSyncOptions {
  editor: TiptapEditor | null
  comments: Comment[]
  syncCommentAnchorsFromEditor: (editor: TiptapEditor) => void
  setActiveCommentId: (id: string | null) => void
  setShowNewComment: (show: boolean) => void
  openPanel: () => void
}

export function useEditorCommentSync({
  editor,
  comments,
  syncCommentAnchorsFromEditor,
  setActiveCommentId,
  setShowNewComment,
  openPanel,
}: UseEditorCommentSyncOptions): void {
  useEffect(() => {
    if (!editor || comments.length === 0) return
    const commentMarkType = editor.state.schema.marks.commentMark
    if (!commentMarkType) return

    const existingCommentMarkIds = new Set<string>()
    forEachCommentMark(editor.state.doc, (id) => {
      existingCommentMarkIds.add(id)
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editor) return
    const syncAnchors = () => syncCommentAnchorsFromEditor(editor)
    syncAnchors()

    const debouncedSync = () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(syncAnchors, 300)
    }

    editor.on("update", debouncedSync)
    return () => {
      editor.off("update", debouncedSync)
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [editor, syncCommentAnchorsFromEditor])

  // Pill-click callback — sets the callback in editor storage so the
  // ProseMirror plugin (in comment-mark.ts) can invoke it on pill clicks.
  const callbacksRef = useRef({ setActiveCommentId, setShowNewComment, comments, openPanel })
  useLayoutEffect(() => {
    callbacksRef.current = { setActiveCommentId, setShowNewComment, comments, openPanel }
  })

  useEffect(() => {
    if (!editor) return
    const pillClickHandler = (commentId: string) => {
      const { setActiveCommentId: setActive, setShowNewComment: setNew, comments: c, openPanel: open } =
        callbacksRef.current
      const hasSavedThread = c.some((comment) => comment.id === commentId)
      if (commentId.startsWith("draft-") && !hasSavedThread) return
      setActive(commentId)
      setNew(false)
      open()
    }
    // eslint-disable-next-line react-hooks/immutability -- writing to ProseMirror storage, not React props
    ;((editor.storage as unknown as Record<string, unknown>).commentMark as { onPillClick: ((id: string) => void) | null }).onPillClick = pillClickHandler
    return () => {
      ;((editor.storage as unknown as Record<string, unknown>).commentMark as { onPillClick: ((id: string) => void) | null }).onPillClick = null
    }
  }, [editor])
}

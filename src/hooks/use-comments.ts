import { useState, useCallback } from "react"
import type { Editor } from "@tiptap/core"

export interface Comment {
  id: string
  quotedText: string
  body: string
  createdAt: string
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const addComment = useCallback((editor: Editor, body: string) => {
    const { from, to } = editor.state.selection
    if (from === to) return null

    const quotedText = editor.state.doc.textBetween(from, to, " ")
    const id = crypto.randomUUID()

    const comment: Comment = {
      id,
      quotedText,
      body,
      createdAt: new Date().toISOString(),
    }

    editor.chain().focus().setCommentMark(id).run()
    setComments((prev) => [...prev, comment])
    setActiveCommentId(id)
    return comment
  }, [])

  const deleteComment = useCallback((editor: Editor, commentId: string) => {
    const { doc } = editor.state
    let markFrom: number | null = null
    let markTo: number | null = null

    doc.descendants((node, pos) => {
      node.marks.forEach((mark) => {
        if (
          mark.type.name === "commentMark" &&
          mark.attrs.commentId === commentId
        ) {
          if (markFrom === null) markFrom = pos
          markTo = pos + node.nodeSize
        }
      })
    })

    if (markFrom !== null && markTo !== null) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: markFrom, to: markTo })
        .unsetCommentMark()
        .run()
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setActiveCommentId(null)
  }, [])

  const formatComments = useCallback(() => {
    return comments.map((c) => `> ${c.quotedText}\n${c.body}`).join("\n\n")
  }, [comments])

  const updateCommentBody = useCallback((commentId: string, body: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, body } : c)),
    )
  }, [])

  const copyComments = useCallback(async () => {
    const text = formatComments()
    await navigator.clipboard.writeText(text)
  }, [formatComments])

  return {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    updateCommentBody,
    deleteComment,
    copyComments,
    hasComments: comments.length > 0,
  }
}

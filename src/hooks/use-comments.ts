import { useState, useCallback } from "react"
import type { Editor } from "@tiptap/core"

export interface CommentMessage {
  id: string
  body: string
  createdAt: string
}

export interface Comment {
  id: string
  quotedText: string
  messages: CommentMessage[]
  createdAt: string
  /** First character position in the document (for ordering threads in the gutter). */
  anchorFrom: number
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const addComment = useCallback(
    (editor: Editor, body: string, existingCommentId?: string) => {
    const { from, to } = editor.state.selection
    if (from === to) return null

    const quotedText = editor.state.doc.textBetween(from, to, " ")
    const id = existingCommentId ?? crypto.randomUUID()
    const createdAt = new Date().toISOString()

    const comment: Comment = {
      id,
      quotedText,
      messages: [{ id: crypto.randomUUID(), body, createdAt }],
      createdAt,
      anchorFrom: from,
    }

    if (!existingCommentId) {
      editor.chain().focus().setCommentMark(id).run()
    }
    setComments((prev) => [...prev, comment])
    setActiveCommentId(id)
    return comment
  },
  [])

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
    return comments
      .map((c) => {
        const thread = c.messages.map((m) => `- ${m.body}`).join("\n")
        return `> ${c.quotedText}\n${thread}`
      })
      .join("\n\n")
  }, [comments])

  const updateCommentBody = useCallback((commentId: string, body: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId || c.messages.length === 0) {
          return c
        }

        const [first, ...rest] = c.messages
        return {
          ...c,
          messages: [{ ...first, body }, ...rest],
        }
      }),
    )
  }, [])

  const addReplyToComment = useCallback((commentId: string, body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: crypto.randomUUID(),
                  body: trimmed,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c,
      ),
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
    addReplyToComment,
    deleteComment,
    copyComments,
    hasComments: comments.length > 0,
  }
}

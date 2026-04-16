import { useState, useCallback, useEffect } from "react"
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
  /** End character position in the document for restoring comment marks. */
  anchorTo?: number
}

const STORAGE_PREFIX = "review-md:comments:v1:"

function storageKey(fileKey: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(fileKey)}`
}

function isCommentMessage(x: unknown): x is CommentMessage {
  if (typeof x !== "object" || x === null) return false
  const m = x as Record<string, unknown>
  return (
    typeof m.id === "string" &&
    typeof m.body === "string" &&
    typeof m.createdAt === "string"
  )
}

function isComment(x: unknown): x is Comment {
  if (typeof x !== "object" || x === null) return false
  const c = x as Record<string, unknown>
  if (typeof c.id !== "string") return false
  if (typeof c.quotedText !== "string") return false
  if (typeof c.createdAt !== "string") return false
  if (typeof c.anchorFrom !== "number") return false
  if (c.anchorTo !== undefined && typeof c.anchorTo !== "number") return false
  if (!Array.isArray(c.messages) || !c.messages.every(isCommentMessage)) {
    return false
  }
  return true
}

function loadPersisted(fileKey: string): {
  comments: Comment[]
  activeCommentId: string | null
} {
  try {
    const raw = localStorage.getItem(storageKey(fileKey))
    if (!raw) {
      return { comments: [], activeCommentId: null }
    }
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== "object") {
      return { comments: [], activeCommentId: null }
    }
    const obj = data as Record<string, unknown>
    const comments = Array.isArray(obj.comments)
      ? (obj.comments as unknown[]).filter(isComment)
      : []
    const activeCommentId =
      obj.activeCommentId === null
        ? null
        : typeof obj.activeCommentId === "string"
          ? obj.activeCommentId
          : null
    return { comments, activeCommentId }
  } catch {
    return { comments: [], activeCommentId: null }
  }
}

function savePersisted(
  fileKey: string,
  comments: Comment[],
  activeCommentId: string | null,
) {
  try {
    localStorage.setItem(
      storageKey(fileKey),
      JSON.stringify({ comments, activeCommentId }),
    )
  } catch {
    // quota / private mode
  }
}

/** Remove every `commentMark` with the given id from the document. */
export function removeCommentMarkFromEditor(editor: Editor, commentId: string): void {
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
    const markType = editor.state.schema.marks.commentMark
    if (markType) {
      const tr = editor.state.tr.removeMark(markFrom, markTo, markType)
      editor.view.dispatch(tr)
    }
  }
}

export function useComments(persistenceKey: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!persistenceKey) {
      // Reset client comment state when no file is loaded (intentional sync from key).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persistence key cleared
      setComments([])
      setActiveCommentId(null)
      setLoadedKey(null)
      return
    }
    const { comments: next, activeCommentId: nextActive } =
      loadPersisted(persistenceKey)
    setComments(next)
    setActiveCommentId(nextActive)
    setLoadedKey(persistenceKey)
  }, [persistenceKey])

  useEffect(() => {
    if (!persistenceKey || loadedKey !== persistenceKey) return
    savePersisted(persistenceKey, comments, activeCommentId)
  }, [persistenceKey, loadedKey, comments, activeCommentId])

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
        anchorTo: to,
      }

      if (!existingCommentId) {
        editor.chain().focus().setCommentMark(id).run()
      }
      setComments((prev) => [...prev, comment])
      setActiveCommentId(id)
      return comment
    },
    [],
  )

  const deleteComment = useCallback((editor: Editor, commentId: string) => {
    removeCommentMarkFromEditor(editor, commentId)

    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setActiveCommentId(null)
  }, [])

  const formatComments = useCallback(() => {
    const fileLabel = persistenceKey?.trim() || "this file"
    const header = [
      `Feedback on \`${fileLabel}\``,
      "",
      "Review comments below. Each block quotes a passage from the file, then lists the notes for that passage.",
      "",
    ].join("\n")

    const threads = comments
      .map((c) => {
        const thread = c.messages.map((m) => `- ${m.body}`).join("\n")
        return `> ${c.quotedText}\n${thread}`
      })
      .join("\n\n")

    return `${header}${threads}`
  }, [comments, persistenceKey])

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

  const syncCommentAnchorsFromEditor = useCallback((editor: Editor) => {
    const nextAnchors = new Map<string, { anchorFrom: number; anchorTo: number }>()
    editor.state.doc.descendants((node, pos) => {
      for (const mark of node.marks) {
        if (
          mark.type.name !== "commentMark" ||
          typeof mark.attrs.commentId !== "string"
        ) {
          continue
        }
        const commentId = mark.attrs.commentId
        const nextFrom = pos
        const nextTo = pos + node.nodeSize
        const existing = nextAnchors.get(commentId)
        if (!existing) {
          nextAnchors.set(commentId, { anchorFrom: nextFrom, anchorTo: nextTo })
          continue
        }
        nextAnchors.set(commentId, {
          anchorFrom: Math.min(existing.anchorFrom, nextFrom),
          anchorTo: Math.max(existing.anchorTo, nextTo),
        })
      }
    })

    setComments((prev) => {
      let changed = false
      const next = prev.map((comment) => {
        const resolved = nextAnchors.get(comment.id)
        if (!resolved) return comment
        if (
          comment.anchorFrom === resolved.anchorFrom &&
          comment.anchorTo === resolved.anchorTo
        ) {
          return comment
        }
        changed = true
        return {
          ...comment,
          anchorFrom: resolved.anchorFrom,
          anchorTo: resolved.anchorTo,
        }
      })
      return changed ? next : prev
    })
  }, [])

  const copyComments = useCallback(async (): Promise<boolean> => {
    const text = formatComments()
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      console.error("Failed to copy comments:", e)
      return false
    }
  }, [formatComments])

  const clearAllComments = useCallback(() => {
    setComments([])
    setActiveCommentId(null)
  }, [])

  return {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    syncCommentAnchorsFromEditor,
    deleteComment,
    copyComments,
    clearAllComments,
    hasComments: comments.length > 0,
  }
}

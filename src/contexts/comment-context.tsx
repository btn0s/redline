import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Editor } from "@tiptap/core"
import type { Comment } from "@/types/comment"
import { useComments } from "@/hooks/use-comments"
import { useDraftComment } from "@/hooks/use-draft-comment"
import { useCommentHover } from "@/hooks/use-comment-hover"

interface CommentContextValue {
  comments: Comment[]
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  addComment: (editor: Editor, body: string, existingCommentId?: string) => Comment | null
  addReplyToComment: (commentId: string, body: string) => void
  deleteComment: (editor: Editor, commentId: string) => void
  copyComments: () => Promise<boolean>
  clearAllComments: () => void
  hasComments: boolean
  syncCommentAnchorsFromEditor: (editor: Editor) => void

  showNewComment: boolean
  setShowNewComment: (show: boolean) => void
  draftQuotedText: string
  pendingDraftCommentId: string | null
  handleAddCommentClick: () => void
  handleCloseNewComment: () => void
  handleSubmitNewComment: (body: string) => void

  commentsPanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void

  hoveredCommentId: string | null
  clearHover: () => void

  showCommentSidebar: boolean
}

const CommentContext = createContext<CommentContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components -- context hook must co-locate with provider
export function useCommentContext(): CommentContextValue {
  const ctx = useContext(CommentContext)
  if (!ctx) throw new Error("useCommentContext must be used within CommentProvider")
  return ctx
}

interface CommentProviderProps {
  editor: Editor | null
  persistenceKey: string | null
  children: ReactNode
}

export function CommentProvider({ editor, persistenceKey, children }: CommentProviderProps) {
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    deleteComment,
    copyComments,
    clearAllComments,
    hasComments,
    syncCommentAnchorsFromEditor,
  } = useComments(persistenceKey)

  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)
  const togglePanel = useCallback(() => setCommentsPanelOpen((p) => !p), [])
  const closePanel = useCallback(() => setCommentsPanelOpen(false), [])
  const openPanel = useCallback(() => setCommentsPanelOpen(true), [])

  const {
    showNewComment,
    setShowNewComment,
    draftQuotedText,
    pendingDraftCommentId,
    handleAddCommentClick,
    handleCloseNewComment,
    handleSubmitNewComment,
  } = useDraftComment({
    editor,
    addComment,
    setActiveCommentId,
    onDraftStarted: openPanel,
  })

  const { hoveredCommentId, clearHover } = useCommentHover(editor)

  const showCommentSidebar = commentsPanelOpen

  const value: CommentContextValue = {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    deleteComment,
    copyComments,
    clearAllComments,
    hasComments,
    syncCommentAnchorsFromEditor,
    showNewComment,
    setShowNewComment,
    draftQuotedText,
    pendingDraftCommentId,
    handleAddCommentClick,
    handleCloseNewComment,
    handleSubmitNewComment,
    commentsPanelOpen,
    togglePanel,
    closePanel,
    openPanel,
    hoveredCommentId,
    clearHover,
    showCommentSidebar,
  }

  return <CommentContext value={value}>{children}</CommentContext>
}

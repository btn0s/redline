import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import type { Editor } from "@tiptap/core"
import type { Comment } from "@/types/comment"
import { useComments } from "@/hooks/use-comments"
import { useDraftComment } from "@/hooks/use-draft-comment"
import { useCommentHover } from "@/hooks/use-comment-hover"
import {
  resolveCommentLinkHighlightId,
  setHoveredComment,
} from "@/extensions/comment-mark"
import {
  loadCommentsPanelOpen,
  saveCommentsPanelOpen,
} from "@/lib/comments-panel-storage"

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
    clearAllComments: clearAllCommentsBase,
    hasComments,
    syncCommentAnchorsFromEditor,
  } = useComments(persistenceKey)

  const editorRef = useRef<Editor | null>(editor)
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  const clearAllComments = useCallback(() => {
    clearAllCommentsBase(editorRef.current)
  }, [clearAllCommentsBase])

  const [commentsPanelOpen, setCommentsPanelOpen] = useState(() =>
    loadCommentsPanelOpen(persistenceKey) ?? false,
  )

  const prevPersistenceKeyRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (prevPersistenceKeyRef.current === persistenceKey) return
    prevPersistenceKeyRef.current = persistenceKey
    const next = loadCommentsPanelOpen(persistenceKey) ?? false
    queueMicrotask(() => {
      setCommentsPanelOpen(next)
    })
  }, [persistenceKey])

  const closePanel = useCallback(() => {
    setCommentsPanelOpen(false)
    saveCommentsPanelOpen(persistenceKey, false)
  }, [persistenceKey])

  const openPanel = useCallback(() => {
    setCommentsPanelOpen(true)
    saveCommentsPanelOpen(persistenceKey, true)
  }, [persistenceKey])

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

  useEffect(() => {
    if (comments.length > 0 || showNewComment) return
    if (!commentsPanelOpen) return
    queueMicrotask(() => {
      setActiveCommentId(null)
      closePanel()
    })
  }, [
    comments.length,
    showNewComment,
    commentsPanelOpen,
    closePanel,
    setActiveCommentId,
  ])

  const linkHighlightId = resolveCommentLinkHighlightId(
    activeCommentId,
    hoveredCommentId,
  )

  useEffect(() => {
    if (!editor) return
    setHoveredComment(editor, linkHighlightId)
  }, [editor, linkHighlightId])

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
    closePanel,
    openPanel,
    hoveredCommentId,
    clearHover,
    showCommentSidebar,
  }

  return <CommentContext value={value}>{children}</CommentContext>
}

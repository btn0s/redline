import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  setDraftSelectionHighlight,
  setHoveredComment,
} from "@/extensions/comment-mark"

interface CommentContextValue {
  comments: Comment[]
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  addComment: (editor: Editor, body: string, existingCommentId?: string) => Comment | null
  addReplyToComment: (commentId: string, body: string) => void
  editCommentMessage: (commentId: string, messageId: string, body: string) => void
  deleteComment: (editor: Editor, commentId: string) => void
  deleteCommentMessage: (
    editor: Editor,
    commentId: string,
    messageId: string,
  ) => void
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
    editCommentMessage,
    deleteComment,
    deleteCommentMessage,
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
  })

  const { hoveredCommentId, clearHover } = useCommentHover(editor)

  useEffect(() => {
    if (comments.length > 0 || showNewComment) return
    queueMicrotask(() => {
      setActiveCommentId(null)
    })
  }, [comments.length, showNewComment, setActiveCommentId])

  const linkHighlightId = resolveCommentLinkHighlightId(
    activeCommentId,
    hoveredCommentId,
  )

  useEffect(() => {
    if (!editor) return
    setHoveredComment(editor, linkHighlightId)
  }, [editor, linkHighlightId])

  useLayoutEffect(() => {
    if (!editor) return
    setDraftSelectionHighlight(editor, pendingDraftCommentId)
  }, [editor, pendingDraftCommentId])

  const showCommentSidebar = comments.length > 0 || showNewComment

  const value: CommentContextValue = {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    editCommentMessage,
    deleteComment,
    deleteCommentMessage,
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
    hoveredCommentId,
    clearHover,
    showCommentSidebar,
  }

  return <CommentContext value={value}>{children}</CommentContext>
}

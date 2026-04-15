import { useState, useCallback, useEffect } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { useFile } from "@/hooks/use-file"
import { useComments } from "@/hooks/use-comments"
import { Editor } from "@/components/editor"
import { CommentBubble } from "@/components/comment-bubble"
import { GutterButton } from "@/components/gutter-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

export function App() {
  const { file, save, saving } = useFile()
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    updateCommentBody,
    deleteComment,
    copyComments,
    hasComments,
  } = useComments()

  const [editor, setEditor] = useState<TiptapEditor | null>(null)
  const [showNewComment, setShowNewComment] = useState(false)
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 })

  const handleEditorReady = useCallback((ed: TiptapEditor) => {
    setEditor(ed)
  }, [])

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const onMarkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const mark = target.closest("mark[data-comment-id]")
      if (mark) {
        const commentId = mark.getAttribute("data-comment-id")
        if (commentId) {
          const rect = mark.getBoundingClientRect()
          setBubblePosition({
            top: rect.bottom + 8,
            left: rect.left,
          })
          setActiveCommentId(commentId)
          setShowNewComment(false)
        }
      }
    }

    dom.addEventListener("click", onMarkClick)
    return () => dom.removeEventListener("click", onMarkClick)
  }, [editor, setActiveCommentId])

  const handleAddCommentClick = useCallback(() => {
    if (!editor) return

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) return

    const range = domSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setBubblePosition({
      top: rect.bottom + 8,
      left: rect.left,
    })
    setShowNewComment(true)
    setActiveCommentId(null)
  }, [editor, setActiveCommentId])

  const handleSubmitNewComment = useCallback(
    (body: string) => {
      if (!editor) return
      addComment(editor, body)
      setShowNewComment(false)
    },
    [editor, addComment],
  )

  useEffect(() => {
    const handleAddComment = () => handleAddCommentClick()
    const handleCopy = () => {
      if (hasComments) void copyComments()
    }

    window.addEventListener("review-md:add-comment", handleAddComment)
    window.addEventListener("review-md:copy-comments", handleCopy)
    return () => {
      window.removeEventListener("review-md:add-comment", handleAddComment)
      window.removeEventListener("review-md:copy-comments", handleCopy)
    }
  }, [handleAddCommentClick, copyComments, hasComments])

  const activeComment = comments.find((c) => c.id === activeCommentId)

  if (!file) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
          <span className="truncate text-sm font-medium">{file.filename}</span>
          {saving && (
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <Spinner className="size-3" />
              Saving…
            </Badge>
          )}
          {hasComments && (
            <span className="text-xs text-muted-foreground">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!hasComments}
            onClick={() => void copyComments()}
          >
            Copy comments
          </Button>
        </div>
      </header>
      <main className="relative mx-auto max-w-3xl px-6 pl-16">
        <Editor
          content={file.content}
          onUpdate={save}
          onEditorReady={handleEditorReady}
          bubbleMenuSuppressed={showNewComment || !!activeCommentId}
          onAddCommentFromBubble={handleAddCommentClick}
        />

        {editor && (
          <GutterButton
            editor={editor}
            onComment={() => {
              handleAddCommentClick()
            }}
          />
        )}

        {showNewComment && (
          <CommentBubble
            position={bubblePosition}
            onSubmit={handleSubmitNewComment}
            onDelete={() => {}}
            onClose={() => setShowNewComment(false)}
          />
        )}

        {activeComment && (
          <CommentBubble
            comment={activeComment}
            position={bubblePosition}
            onSubmit={(body) => {
              updateCommentBody(activeComment.id, body)
              setActiveCommentId(null)
            }}
            onDelete={() => {
              if (editor) deleteComment(editor, activeComment.id)
            }}
            onClose={() => setActiveCommentId(null)}
          />
        )}
      </main>
    </div>
  )
}

export default App

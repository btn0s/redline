import { useState, useCallback, useEffect } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { useFile } from "@/hooks/use-file"
import { useComments } from "@/hooks/use-comments"
import { Editor } from "@/components/editor"
import { CommentSidebar } from "@/components/comment-sidebar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function App() {
  const { file, save, saving, loadError } = useFile()
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
  const [draftQuotedText, setDraftQuotedText] = useState("")

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
    const { from, to } = editor.state.selection
    if (from === to) return
    setDraftQuotedText(editor.state.doc.textBetween(from, to, " "))
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

  if (loadError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm">{loadError}</p>
        <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
          To use{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
            pnpm dev
          </code>{" "}
          without the CLI, add{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
            REVIEW_MD_FILE=./path/to/file.md
          </code>{" "}
          to{" "}
          <code className="font-mono text-[11px]">.env.local</code> or{" "}
          <code className="font-mono text-[11px]">.env.development.local</code>{" "}
          (path relative to the project root), then restart Vite. Or run{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
            node dist/cli/index.js ./file.md
          </code>{" "}
          and open the URL it prints (port 4700).
        </p>
      </div>
    )
  }

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
    <div className="flex min-h-svh flex-col pb-[max(5.5rem,env(safe-area-inset-bottom))]">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <Editor
              content={file.content}
              onUpdate={save}
              onEditorReady={handleEditorReady}
              bubbleMenuSuppressed={showNewComment || !!activeCommentId}
              onAddCommentFromBubble={handleAddCommentClick}
            />
          </div>
        </main>

        <aside className="border-border flex max-h-[min(42svh,380px)] min-h-0 w-full flex-1 flex-col border-t lg:max-h-none lg:w-[min(100%,320px)] lg:flex-none lg:self-stretch lg:border-t-0 lg:border-l">
          <CommentSidebar
            editor={editor}
            comments={comments}
            showNewComment={showNewComment}
            draftQuotedText={draftQuotedText}
            onCloseNewComment={() => setShowNewComment(false)}
            onSubmitNewComment={handleSubmitNewComment}
            activeCommentId={activeCommentId}
            setActiveCommentId={setActiveCommentId}
            updateCommentBody={updateCommentBody}
            deleteComment={deleteComment}
          />
        </aside>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="App toolbar"
      >
        <div className="bg-background/90 text-foreground pointer-events-auto flex max-w-[min(100%,42rem)] items-center gap-3 rounded-2xl border px-3 py-2 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md supports-backdrop-filter:bg-background/75">
          <span className="text-muted-foreground shrink-0 text-[11px] font-semibold tracking-tight">
            review-md
          </span>
          <span
            className="text-muted-foreground min-w-0 max-w-[min(14rem,42vw)] truncate text-xs"
            title={file.filename}
          >
            {file.filename}
          </span>
          {saving && (
            <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
              <Spinner className="size-3" />
              Saving
            </span>
          )}
          {hasComments && (
            <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
              {comments.length}
            </span>
          )}
          <div className="bg-border mx-0.5 h-4 w-px shrink-0" aria-hidden />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 shrink-0 text-xs"
            disabled={!hasComments}
            onClick={() => void copyComments()}
          >
            Copy all
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App

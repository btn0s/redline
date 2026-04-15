import { useState, useCallback, useEffect } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import {
  Copy,
  Loader2,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider.tsx"
import { useFile } from "@/hooks/use-file"
import { useComments } from "@/hooks/use-comments"
import { Editor } from "@/components/editor"
import { CommentSidebar } from "@/components/comment-sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

function ThemeCycleButton() {
  const { theme, setTheme } = useTheme()

  const cycle = useCallback(() => {
    if (theme === "system") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("system")
    }
  }, [theme, setTheme])

  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon
  const label =
    theme === "system"
      ? "System theme"
      : theme === "light"
        ? "Light theme"
        : "Dark theme"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      title={`${label} — click to cycle`}
      aria-label={`Cycle color theme. Current: ${label}.`}
      className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
    </Button>
  )
}

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

  const pathLeft = file.path ?? file.filename
  const handleRight = "@btn0s/review-md"

  return (
    <div className="flex min-h-svh flex-col pt-[calc(env(safe-area-inset-top)+2.75rem)] pb-[max(3.5rem,env(safe-area-inset-bottom))]">
      <header
        className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-backdrop-filter:bg-background/70"
        aria-label="Current file and repository"
      >
        <div className="flex h-9 min-h-9 items-center justify-between gap-3 px-4 text-[11px] leading-none">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="truncate font-mono text-muted-foreground"
              title={pathLeft}
            >
              {pathLeft}
            </span>
            {saving && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center text-muted-foreground"
              >
                <span className="sr-only">Saving</span>
                <Loader2
                  className="size-3 shrink-0 animate-spin opacity-80"
                  aria-hidden
                />
              </span>
            )}
          </div>
          <span
            className="shrink-0 font-mono text-muted-foreground tabular-nums"
            title={handleRight}
          >
            {handleRight}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          <h1 className="sr-only">Review {file.filename}</h1>
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
        aria-label="Quick actions"
      >
        <div
          className="pointer-events-auto flex items-center gap-0 rounded-full border border-border bg-card/95 px-0.5 py-0.5 text-muted-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md supports-backdrop-filter:bg-card/85 dark:border-white/10 dark:bg-[#141414]/95 dark:text-zinc-400 dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] dark:ring-black/20 dark:supports-backdrop-filter:bg-[#141414]/85"
          role="toolbar"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!hasComments}
            onClick={() => void copyComments()}
            title="Copy all comments"
            aria-label="Copy all comments"
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            <Copy className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 dark:focus-visible:ring-white/30"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="size-3.5 stroke-[1.5]" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8}>
              <DropdownMenuLabel>review-md</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                Comments: {comments.length}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs">
                Press{" "}
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">D</kbd>{" "}
                to cycle theme when not editing text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeCycleButton />
        </div>
      </div>
    </div>
  )
}

export default App

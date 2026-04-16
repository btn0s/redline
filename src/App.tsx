import { useState, useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { useFile } from "@/hooks/use-file"
import { useComments } from "@/hooks/use-comments"
import { useCommentHover } from "@/hooks/use-comment-hover"
import { useDraftComment } from "@/hooks/use-draft-comment"
import { useEditorCommentSync } from "@/hooks/use-editor-comment-sync"
import { Editor } from "@/components/editor"
import { CommentSidebar } from "@/components/comment-sidebar"
import { BottomToolbar } from "@/components/bottom-toolbar"
import { OutdatedReloadDialog } from "@/components/outdated-reload-dialog"
import { ReviewHeader } from "@/components/review-header"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function App() {
  const {
    file,
    save,
    saving,
    loadError,
    isOutdated,
    reloadFromDisk,
    notifyMarkdownChange,
    dirty,
    contentReloadNonce,
  } = useFile()
  const commentsPersistenceKey = file ? (file.path ?? file.filename) : null
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    addComment,
    addReplyToComment,
    deleteComment,
    copyComments,
    clearAllComments,
    syncCommentAnchorsFromEditor,
    hasComments,
  } = useComments(commentsPersistenceKey)

  const [editor, setEditor] = useState<TiptapEditor | null>(null)
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [outdatedReloadOpen, setOutdatedReloadOpen] = useState(false)
  const [outdatedReloadPending, setOutdatedReloadPending] = useState(false)

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
    onDraftStarted: () => setCommentsPanelOpen(true),
  })

  useEditorCommentSync({
    editor,
    comments,
    syncCommentAnchorsFromEditor,
    setActiveCommentId,
    setShowNewComment,
  })

  const { hoveredCommentId, clearHover } = useCommentHover(editor)

  const handleMarkdownUpdate = useCallback(
    (md: string) => {
      notifyMarkdownChange(md)
      save(md)
    },
    [notifyMarkdownChange, save],
  )

  const confirmOutdatedReload = useCallback(async () => {
    setOutdatedReloadPending(true)
    try {
      await reloadFromDisk()
      flushSync(() => {
        if (showNewComment || pendingDraftCommentId) {
          handleCloseNewComment()
        }
        clearAllComments()
        setCommentsPanelOpen(false)
        clearHover()
      })
      setOutdatedReloadOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setOutdatedReloadPending(false)
    }
  }, [
    showNewComment,
    pendingDraftCommentId,
    handleCloseNewComment,
    clearAllComments,
    reloadFromDisk,
    clearHover,
  ])

  useEffect(() => {
    const handleAddComment = () => handleAddCommentClick()
    const handleCopy = () => {
      if (hasComments) void copyComments()
    }
    const handleTogglePanel = () => {
      setCommentsPanelOpen((p) => !p)
    }

    window.addEventListener("review-md:add-comment", handleAddComment)
    window.addEventListener("review-md:copy-comments", handleCopy)
    window.addEventListener("review-md:toggle-comments-panel", handleTogglePanel)
    return () => {
      window.removeEventListener("review-md:add-comment", handleAddComment)
      window.removeEventListener("review-md:copy-comments", handleCopy)
      window.removeEventListener(
        "review-md:toggle-comments-panel",
        handleTogglePanel,
      )
    }
  }, [handleAddCommentClick, copyComments, hasComments])

  const showCommentSidebar =
    showNewComment || activeCommentId !== null || commentsPanelOpen

  const collapseExpandedThreadOrDraft = useCallback(() => {
    if (showNewComment) handleCloseNewComment()
    if (activeCommentId !== null) setActiveCommentId(null)
  }, [showNewComment, handleCloseNewComment, activeCommentId, setActiveCommentId])

  const handleEscapeRedlines = useCallback(() => {
    if (showNewComment) {
      handleCloseNewComment()
      return
    }
    if (activeCommentId !== null) {
      setActiveCommentId(null)
      return
    }
    if (commentsPanelOpen) {
      setCommentsPanelOpen(false)
    }
  }, [
    showNewComment,
    handleCloseNewComment,
    activeCommentId,
    commentsPanelOpen,
    setActiveCommentId,
  ])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return
      if (e.key.toLowerCase() !== "l") return
      const t = e.target
      if (
        t instanceof HTMLElement &&
        (t.closest("textarea, input") ||
          t.closest('[contenteditable="true"]') ||
          t.isContentEditable)
      ) {
        return
      }
      if (t instanceof Element && t.closest(".ProseMirror")) {
        return
      }
      e.preventDefault()
      setCommentsPanelOpen((p) => !p)
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [])

  useEffect(() => {
    if (!showCommentSidebar) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        e.preventDefault()
        handleEscapeRedlines()
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [showCommentSidebar, handleEscapeRedlines])

  useEffect(() => {
    if (!showCommentSidebar) return
    if (activeCommentId === null && !showNewComment) return

    const exemptFromThreadCollapse = (el: Element | null) => {
      if (!el) return false
      return !!(
        el.closest("[data-redlines-sidebar]") ||
        el.closest(".bubble-menu") ||
        el.closest("[data-prevent-redlines-dismiss]") ||
        el.closest('[data-slot="dropdown-menu-content"]') ||
        el.closest('[data-slot="dropdown-menu-sub-content"]') ||
        el.closest('[data-slot="alert-dialog-overlay"]') ||
        el.closest('[data-slot="alert-dialog-content"]') ||
        el.closest('[data-slot="alert-dialog-portal"]')
      )
    }
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      if (exemptFromThreadCollapse(t)) return
      collapseExpandedThreadOrDraft()
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [
    showCommentSidebar,
    activeCommentId,
    showNewComment,
    collapseExpandedThreadOrDraft,
  ])

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

  const sidebarProps = {
    editor,
    comments,
    showNewComment,
    draftQuotedText,
    onCloseNewComment: handleCloseNewComment,
    onSubmitNewComment: handleSubmitNewComment,
    activeCommentId,
    setActiveCommentId,
    addReplyToComment,
    deleteComment,
    hoveredCommentId,
  }

  return (
    <div className="flex min-h-svh flex-col pt-[calc(env(safe-area-inset-top)+2.75rem)] pb-[max(3.5rem,env(safe-area-inset-bottom))]">
      <ReviewHeader
        filePath={pathLeft}
        isOutdated={isOutdated}
        saving={saving}
        onOutdatedClick={() => setOutdatedReloadOpen(true)}
      />

      <OutdatedReloadDialog
        open={outdatedReloadOpen}
        onOpenChange={(open) => {
          if (!open && outdatedReloadPending) return
          setOutdatedReloadOpen(open)
        }}
        dirty={dirty}
        pending={outdatedReloadPending}
        onConfirm={confirmOutdatedReload}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          <h1 className="sr-only">Review {file.filename}</h1>
          <div
            ref={shellRef}
            className={cn(
              "mx-auto w-full max-w-[72rem] py-6",
              showCommentSidebar
                ? "px-3 sm:px-4 lg:px-5 xl:px-6"
                : "px-6",
            )}
          >
            <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-3 xl:gap-5 2xl:gap-6">
              <div
                className={
                  showCommentSidebar
                    ? "min-w-0 w-full max-w-3xl"
                    : "mx-auto min-w-0 w-full max-w-3xl"
                }
              >
                <Editor
                  content={file.content}
                  onUpdate={handleMarkdownUpdate}
                  contentReloadNonce={contentReloadNonce}
                  onEditorReady={setEditor}
                  bubbleMenuSuppressed={showNewComment || activeCommentId !== null}
                  onAddComment={handleAddCommentClick}
                />
              </div>

              <aside
                className={cn(
                  showCommentSidebar
                    ? "mx-auto w-full min-w-0 max-w-md sm:max-w-lg lg:sticky lg:top-6 lg:mx-0 lg:block lg:min-h-0 lg:w-[clamp(13.5rem,22vw,16.5rem)] lg:max-w-none lg:shrink-0 lg:flex-none xl:w-[clamp(14rem,19vw,17rem)]"
                    : "hidden min-h-0 w-0 min-w-0 shrink-0 flex-none scale-[0.98] overflow-hidden opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none lg:sticky lg:top-6 lg:block",
                )}
                aria-hidden={!showCommentSidebar}
              >
                <div className="min-w-0 w-full max-w-full">
                  <CommentSidebar {...sidebarProps} />
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      <BottomToolbar
        commentsPanelOpen={commentsPanelOpen}
        onTogglePanel={() => setCommentsPanelOpen((p) => !p)}
        hasComments={hasComments}
        onCopyComments={copyComments}
        commentsCount={comments.length}
      />
    </div>
  )
}

export default App

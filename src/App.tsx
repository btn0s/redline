import { useState, useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import type { Editor as TiptapEditor } from "@tiptap/core"
import {
  Copy,
  Loader2,
  MessagesSquare,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider.tsx"
import { useFile } from "@/hooks/use-file"
import { useComments, type Comment } from "@/hooks/use-comments"
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

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
      className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
    >
      <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
    </Button>
  )
}

function resolveCommentRange(
  editor: TiptapEditor,
  comment: Comment,
): { from: number; to: number } | null {
  const docSize = editor.state.doc.content.size
  if (docSize < 2) return null

  const from = Math.max(1, Math.min(comment.anchorFrom, docSize - 1))
  const fallbackLength = Math.max(comment.quotedText.trim().length, 1)
  const rawTo =
    typeof comment.anchorTo === "number"
      ? comment.anchorTo
      : comment.anchorFrom + fallbackLength
  const to = Math.max(from + 1, Math.min(rawTo, docSize))

  if (to <= from) return null
  return { from, to }
}

function normalizeQuotedText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function resolveCommentRangeNearAnchor(
  editor: TiptapEditor,
  comment: Comment,
): { from: number; to: number } | null {
  const docSize = editor.state.doc.content.size
  if (docSize < 2) return null
  const normalizedQuote = normalizeQuotedText(comment.quotedText)
  if (!normalizedQuote) return null

  const initial = resolveCommentRange(editor, comment)
  const baseFrom = initial?.from ?? Math.max(1, Math.min(comment.anchorFrom, docSize - 1))
  const baseLength = Math.max(
    (initial?.to ?? baseFrom + 1) - baseFrom,
    normalizedQuote.length,
    1,
  )
  const maxOffset = Math.min(docSize, 600)
  const maxLengthJitter = 20

  for (let k = 0; k <= maxOffset; k += 1) {
    const offsets = k === 0 ? [0] : [k, -k]
    for (const offset of offsets) {
      const candidateFrom = Math.max(1, Math.min(baseFrom + offset, docSize - 1))
      for (let jitter = 0; jitter <= maxLengthJitter; jitter += 1) {
        const lengths =
          jitter === 0 ? [baseLength] : [baseLength + jitter, baseLength - jitter]
        for (const candidateLength of lengths) {
          if (candidateLength < 1) continue
          const candidateTo = Math.max(
            candidateFrom + 1,
            Math.min(candidateFrom + candidateLength, docSize),
          )
          if (candidateTo <= candidateFrom) continue
          const candidateText = normalizeQuotedText(
            editor.state.doc.textBetween(candidateFrom, candidateTo, " "),
          )
          if (candidateText === normalizedQuote) {
            return { from: candidateFrom, to: candidateTo }
          }
        }
      }
    }
  }
  return null
}

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
  const [showNewComment, setShowNewComment] = useState(false)
  const [draftQuotedText, setDraftQuotedText] = useState("")
  const [pendingDraftCommentId, setPendingDraftCommentId] = useState<string | null>(
    null,
  )
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [outdatedReloadOpen, setOutdatedReloadOpen] = useState(false)
  const [outdatedReloadPending, setOutdatedReloadPending] = useState(false)

  const handleEditorReady = useCallback((ed: TiptapEditor) => {
    setEditor(ed)
  }, [])

  const handleMarkdownUpdate = useCallback(
    (md: string) => {
      notifyMarkdownChange(md)
      save(md)
    },
    [notifyMarkdownChange, save],
  )

  useEffect(() => {
    if (!editor || comments.length === 0) return
    const commentMarkType = editor.state.schema.marks.commentMark
    if (!commentMarkType) return

    const existingCommentMarkIds = new Set<string>()
    editor.state.doc.descendants((node) => {
      node.marks.forEach((mark) => {
        if (
          mark.type.name === "commentMark" &&
          typeof mark.attrs.commentId === "string"
        ) {
          existingCommentMarkIds.add(mark.attrs.commentId)
        }
      })
    })

    const missingComments = comments.filter(
      (comment) => !existingCommentMarkIds.has(comment.id),
    )
    if (missingComments.length === 0) return

    let tr = editor.state.tr
    let changed = false

    for (const comment of missingComments) {
      const anchoredRange = resolveCommentRange(editor, comment)
      const anchoredText = anchoredRange
        ? normalizeQuotedText(
            editor.state.doc.textBetween(anchoredRange.from, anchoredRange.to, " "),
          )
        : ""
      const quote = normalizeQuotedText(comment.quotedText)
      const range =
        anchoredRange && anchoredText === quote
          ? anchoredRange
          : resolveCommentRangeNearAnchor(editor, comment) ?? anchoredRange
      if (!range) continue
      tr = tr.addMark(
        range.from,
        range.to,
        commentMarkType.create({ commentId: comment.id }),
      )
      changed = true
    }

    if (!changed) return
    tr.setMeta("addToHistory", false)
    editor.view.dispatch(tr)
  }, [editor, comments])

  useEffect(() => {
    if (!editor) return
    const syncAnchors = () => syncCommentAnchorsFromEditor(editor)
    syncAnchors()
    editor.on("update", syncAnchors)
    editor.on("transaction", syncAnchors)
    return () => {
      editor.off("update", syncAnchors)
      editor.off("transaction", syncAnchors)
    }
  }, [editor, syncCommentAnchorsFromEditor])

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const onPillClick = (event: MouseEvent) => {
      let el = event.target as HTMLElement | null
      while (el && el !== dom) {
        if (el.matches("mark.comment-mark[data-comment-id]")) {
          const rect = el.getBoundingClientRect()
          if (event.clientY >= rect.bottom - 8) {
            const commentId = el.getAttribute("data-comment-id")
            if (!commentId) return
            const hasSavedThread = comments.some((c) => c.id === commentId)
            if (commentId.startsWith("draft-") && !hasSavedThread) return
            event.preventDefault()
            event.stopPropagation()
            setActiveCommentId(commentId)
            setShowNewComment(false)
          }
          return
        }
        el = el.parentElement
      }
    }

    dom.addEventListener("click", onPillClick, true)
    return () => dom.removeEventListener("click", onPillClick, true)
  }, [editor, setActiveCommentId, comments])

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const syncHotMark = () => {
      const hot = hoveredCommentId
      dom.querySelectorAll("mark.comment-mark[data-comment-id]").forEach((node) => {
        const el = node as HTMLElement
        const id = el.getAttribute("data-comment-id")
        if (hot && id === hot) {
          el.classList.add("comment-mark--hot")
        } else {
          el.classList.remove("comment-mark--hot")
        }
      })
    }
    syncHotMark()
    editor.on("update", syncHotMark)
    editor.on("transaction", syncHotMark)
    return () => {
      editor.off("update", syncHotMark)
      editor.off("transaction", syncHotMark)
    }
  }, [editor, hoveredCommentId])

  useEffect(() => {
    if (!editor) return
    const editorDom = editor.view.dom
    const onMove = (e: PointerEvent) => {
      const t = e.target
      if (!(t instanceof Element) || !t.closest) return
      let next: string | null = null
      if (t.closest("[data-redlines-sidebar]")) {
        const row = t.closest("[data-comment-thread-id]")
        next = row?.getAttribute("data-comment-thread-id") ?? null
      } else if (editorDom.contains(t)) {
        const mark = t.closest("mark.comment-mark[data-comment-id]")
        next = mark?.getAttribute("data-comment-id") ?? null
      }
      setHoveredCommentId((prev) => (prev === next ? prev : next))
    }
    document.addEventListener("pointermove", onMove, { passive: true })
    return () => document.removeEventListener("pointermove", onMove)
  }, [editor])

  const handleAddCommentClick = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from === to) return
    const draftId = `draft-${crypto.randomUUID()}`
    editor.chain().focus().setCommentMark(draftId).run()
    setPendingDraftCommentId(draftId)
    setDraftQuotedText(editor.state.doc.textBetween(from, to, " "))
    setShowNewComment(true)
    setActiveCommentId(null)
    setCommentsPanelOpen(true)
  }, [editor, setActiveCommentId])

  const clearDraftMark = useCallback(
    (draftId: string) => {
      if (!editor) return
      const { doc } = editor.state
      let markFrom: number | null = null
      let markTo: number | null = null

      doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (
            mark.type.name === "commentMark" &&
            mark.attrs.commentId === draftId
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
    },
    [editor],
  )

  const handleCloseNewComment = useCallback(() => {
    if (pendingDraftCommentId) {
      clearDraftMark(pendingDraftCommentId)
      setPendingDraftCommentId(null)
    }
    setShowNewComment(false)
  }, [clearDraftMark, pendingDraftCommentId])

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
        setHoveredCommentId(null)
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
  ])

  const handleSubmitNewComment = useCallback(
    (body: string) => {
      if (!editor) return
      addComment(editor, body, pendingDraftCommentId ?? undefined)
      setPendingDraftCommentId(null)
      setShowNewComment(false)
    },
    [editor, addComment, pendingDraftCommentId],
  )

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
  }, [handleAddCommentClick, copyComments, hasComments, setCommentsPanelOpen])

  const showCommentSidebar =
    showNewComment || activeCommentId !== null || commentsPanelOpen

  const collapseExpandedThreadOrDraft = useCallback(() => {
    if (showNewComment) handleCloseNewComment()
    if (activeCommentId !== null) setActiveCommentId(null)
  }, [showNewComment, activeCommentId, handleCloseNewComment, setActiveCommentId])

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
    activeCommentId,
    commentsPanelOpen,
    handleCloseNewComment,
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
  const handleRight = "@btn0s/review-md"

  return (
    <div className="flex min-h-svh flex-col pt-[calc(env(safe-area-inset-top)+2.75rem)] pb-[max(3.5rem,env(safe-area-inset-bottom))]">
      <header
        className="fixed inset-x-0 top-0 z-40 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-backdrop-filter:bg-background/70"
        aria-label="Current file and repository"
        data-prevent-redlines-dismiss=""
      >
        <div className="flex h-9 min-h-9 items-center justify-between gap-3 px-4 text-[11px] leading-none">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="truncate font-mono text-muted-foreground"
              title={pathLeft}
            >
              {pathLeft}
            </span>
            {isOutdated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-5 shrink-0 rounded-full px-2 py-0 text-[0.625rem] font-medium"
                onClick={() => setOutdatedReloadOpen(true)}
                title="File changed on disk — reload clears comments and loads latest"
              >
                Outdated · Reload
              </Button>
            ) : null}
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

      <AlertDialog
        open={outdatedReloadOpen}
        onOpenChange={(open) => {
          if (!open && outdatedReloadPending) return
          setOutdatedReloadOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reload from disk?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-balance text-left">
              {dirty ? (
                <span className="block">
                  Your unsaved edits will be discarded.
                </span>
              ) : null}
              <span className="block">
                All comments will be cleared. Anchors and quotes may no longer
                match the file after it changes on disk.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={outdatedReloadPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={outdatedReloadPending}
              onClick={() => void confirmOutdatedReload()}
            >
              {outdatedReloadPending ? (
                <>
                  <Loader2
                    className="mr-1.5 size-3.5 shrink-0 animate-spin"
                    aria-hidden
                  />
                  Reloading…
                </>
              ) : (
                "Reload from disk"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  onEditorReady={handleEditorReady}
                  bubbleMenuSuppressed={
                    showNewComment || activeCommentId !== null
                  }
                  onAddComment={handleAddCommentClick}
                />
              </div>

              <aside
                className={
                  showCommentSidebar
                    ? "hidden min-h-0 w-0 shrink-0 flex-none overflow-hidden opacity-100 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:sticky lg:top-6 lg:block lg:w-[clamp(13.5rem,22vw,16.5rem)] lg:min-w-0 xl:w-[clamp(14rem,19vw,17rem)]"
                    : "hidden min-h-0 w-0 min-w-0 flex-none scale-[0.98] overflow-hidden opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none lg:sticky lg:top-6 lg:block"
                }
                aria-hidden={!showCommentSidebar}
              >
                <div className="min-w-0 w-full max-w-full">
                  <CommentSidebar
                    editor={editor}
                    comments={comments}
                    showNewComment={showNewComment}
                    draftQuotedText={draftQuotedText}
                    onCloseNewComment={handleCloseNewComment}
                    onSubmitNewComment={handleSubmitNewComment}
                    activeCommentId={activeCommentId}
                    setActiveCommentId={setActiveCommentId}
                    addReplyToComment={addReplyToComment}
                    deleteComment={deleteComment}
                    hoveredCommentId={hoveredCommentId}
                  />
                </div>
              </aside>

              {showCommentSidebar ? (
                <aside className="mx-auto w-full min-w-0 max-w-md sm:max-w-lg lg:hidden">
                  <CommentSidebar
                    editor={editor}
                    comments={comments}
                    showNewComment={showNewComment}
                    draftQuotedText={draftQuotedText}
                    onCloseNewComment={handleCloseNewComment}
                    onSubmitNewComment={handleSubmitNewComment}
                    activeCommentId={activeCommentId}
                    setActiveCommentId={setActiveCommentId}
                    addReplyToComment={addReplyToComment}
                    deleteComment={deleteComment}
                    hoveredCommentId={hoveredCommentId}
                  />
                </aside>
              ) : null}
            </div>

          </div>
        </main>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Quick actions"
        data-prevent-redlines-dismiss=""
      >
        <div
          className="pointer-events-auto flex items-center gap-0 rounded-full border border-border bg-card/95 px-0.5 py-0.5 text-muted-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md supports-backdrop-filter:bg-card/85 dark:border-white/10 dark:bg-[#141414]/95 dark:text-zinc-400 dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] dark:ring-black/20 dark:supports-backdrop-filter:bg-[#141414]/85"
          role="toolbar"
          data-prevent-redlines-dismiss=""
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Redlines — browse all comment threads (⌘⇧L / Ctrl+Shift+L)"
            aria-label="Toggle redlines panel"
            aria-pressed={commentsPanelOpen}
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
            onClick={() => setCommentsPanelOpen((p) => !p)}
          >
            <MessagesSquare className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!hasComments}
            onClick={() => void copyComments()}
            title="Copy all comments"
            aria-label="Copy all comments"
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
          >
            <Copy className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground outline-none transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] dark:text-zinc-400 dark:focus-visible:ring-white/30"
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
                Redlines panel:{" "}
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">⌘⇧L</kbd>{" "}
                / <kbd className="bg-muted rounded px-1 py-0.5 font-mono">Ctrl+Shift+L</kbd>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs">
                Theme:{" "}
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">D</kbd>{" "}
                when not editing text
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

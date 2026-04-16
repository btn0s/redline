import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { MessageSquare, Trash2 } from "lucide-react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/types/comment"
import { useCommentContext } from "@/contexts/comment-context"
import { useShortcutScheme } from "@/contexts/shortcut-scheme-context"
import { resolveCommentLinkHighlightId } from "@/extensions/comment-mark"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import {
  addCommentShortcutDisplay,
  modShiftKeyCompact,
} from "@/lib/format-shortcut"
import { useCommentSidebarLayout } from "@/hooks/use-comment-sidebar-layout"

export function CommentSidebar({ editor }: { editor: TiptapEditor | null }) {
  const { scheme } = useShortcutScheme()
  const {
    comments,
    showNewComment,
    draftQuotedText,
    handleCloseNewComment,
    handleSubmitNewComment,
    activeCommentId,
    setActiveCommentId,
    addReplyToComment,
    deleteComment,
    hoveredCommentId,
  } = useCommentContext()

  const linkHighlightId = resolveCommentLinkHighlightId(
    activeCommentId,
    hoveredCommentId,
  )

  const ordered = useMemo(
    () => [...comments].sort((a, b) => a.anchorFrom - b.anchorFrom),
    [comments],
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const draftWrapperRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const {
    positions,
    draftTop,
    containerMinHeightPx,
    layoutReady,
    reduceMotion,
  } = useCommentSidebarLayout({
    editor,
    orderedComments: ordered,
    showNewComment,
    activeCommentId,
    containerRef,
    itemRefs,
    draftWrapperRef,
  })

  useEffect(() => {
    if (!activeCommentId) return
    const el = itemRefs.current[activeCommentId]
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [activeCommentId])

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 w-full pr-1"
      style={
        editor
          ? { minHeight: `${Math.max(containerMinHeightPx, 1)}px` }
          : undefined
      }
      data-redlines-sidebar=""
      aria-label="Redlines"
    >
      {ordered.length === 0 && !showNewComment && (
        <p className="text-caption text-muted-foreground relative py-2 leading-snug tracking-tight">
          Select text, then add a comment (
          <Kbd className="text-[10px]">{addCommentShortcutDisplay(scheme)}</Kbd>
          ). Open redlines with the toolbar or{" "}
          <Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd> (also
          works when the editor is not focused).
        </p>
      )}

      {ordered.map((comment) => {
        const dimForLink =
          linkHighlightId !== null && linkHighlightId !== comment.id
        const y = positions[comment.id] ?? 0
        return (
          <div
            key={comment.id}
            data-comment-thread-id={comment.id}
            ref={(el) => {
              itemRefs.current[comment.id] = el
            }}
            className={cn(
              "absolute left-0 right-0 top-0 will-change-transform",
              layoutReady &&
                !reduceMotion &&
                "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              dimForLink && "opacity-[0.35]",
            )}
            style={{ transform: `translate3d(0, ${y}px, 0)` }}
          >
            <ThreadRow
              comment={comment}
              isActive={activeCommentId === comment.id}
              onSelect={() => setActiveCommentId(comment.id)}
              onReply={(body) => addReplyToComment(comment.id, body)}
              onDelete={() => {
                if (editor) deleteComment(editor, comment.id)
              }}
            />
          </div>
        )
      })}

      {showNewComment && (
        <div
          ref={draftWrapperRef}
          className={cn(
            "absolute left-0 right-0 top-0 will-change-transform",
            layoutReady &&
              !reduceMotion &&
              "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          )}
          style={{ transform: `translate3d(0, ${draftTop ?? 0}px, 0)` }}
        >
          <NewCommentDraft
            key={draftQuotedText}
            quotedText={draftQuotedText}
            onSubmit={handleSubmitNewComment}
            onCancel={handleCloseNewComment}
          />
        </div>
      )}
    </div>
  )
}

function NewCommentDraft({
  quotedText,
  onSubmit,
  onCancel,
}: {
  quotedText: string
  onSubmit: (body: string) => void
  onCancel: () => void
}) {
  const [body, setBody] = useState("")

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setBody("")
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") onCancel()
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 shadow-sm">
      {quotedText ? (
        <blockquote className="text-caption mb-2 border-l-2 border-border/70 pl-2.5 leading-snug text-muted-foreground not-italic line-clamp-2">
          {quotedText}
        </blockquote>
      ) : null}
      <Textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Comment…"
        aria-label="New comment"
        rows={3}
        className="resize-none text-[13px] border-border/50 bg-background/60"
      />
      <div className="flex justify-end gap-1.5 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 text-xs"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          Add
        </Button>
      </div>
    </div>
  )
}

const ThreadRow = memo(function ThreadRow({
  comment,
  isActive,
  onSelect,
  onReply,
  onDelete,
}: {
  comment: Comment
  isActive: boolean
  onSelect: () => void
  onReply: (body: string) => void
  onDelete: () => void
}) {
  const [replyBody, setReplyBody] = useState("")
  const latestMessage = comment.messages[comment.messages.length - 1]

  const handleReply = () => {
    const trimmed = replyBody.trim()
    if (!trimmed) return
    onReply(trimmed)
    setReplyBody("")
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleReply()
    }
  }

  if (isActive) {
    return (
      <article
        className="rounded-lg border border-border/60 bg-muted/30 p-2.5 shadow-sm"
        aria-labelledby={`comment-${comment.id}-quote`}
      >
        <blockquote
          id={`comment-${comment.id}-quote`}
          className="text-caption border-l-2 border-border/70 pl-2.5 leading-snug text-muted-foreground not-italic line-clamp-2"
        >
          {comment.quotedText}
        </blockquote>

        <div className="mt-2 space-y-1">
          {comment.messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[12px] leading-relaxed whitespace-pre-wrap",
                index === 0
                  ? "bg-background/80"
                  : "bg-background/50 ml-2 border-l border-border/40",
              )}
            >
              {message.body}
            </div>
          ))}
        </div>

        <div className="mt-2.5">
          <Textarea
            autoFocus
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Reply to comment thread"
            rows={2}
            placeholder="Reply…"
            className="resize-none text-[12px] border-border/50 bg-background/60"
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground/60 hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete thread"
          >
            <Trash2 />
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-6 px-2.5 text-[11px]"
            onClick={handleReply}
          >
            Reply
          </Button>
        </div>
      </article>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "cursor-pointer rounded-lg border border-transparent p-2.5",
        "transition-[background-color,border-color,transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:border-border/50 hover:bg-muted/30 hover:shadow-sm",
        "active:scale-[0.98]",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <blockquote className="text-caption border-l-2 border-border/50 pl-2.5 leading-snug text-muted-foreground not-italic line-clamp-2">
        {comment.quotedText}
      </blockquote>
      <p className="mt-1.5 text-[12px] leading-relaxed whitespace-pre-wrap line-clamp-3">
        {latestMessage?.body}
      </p>
      {comment.messages.length > 1 && (
        <div className="mt-1.5 flex items-center gap-1 text-muted-foreground/70">
          <MessageSquare className="size-3" />
          <span className="text-[10px]">
            {comment.messages.length} replies
          </span>
        </div>
      )}
    </div>
  )
})

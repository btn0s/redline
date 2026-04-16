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
import { resolveCommentLinkHighlightId } from "@/extensions/comment-mark"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export function CommentSidebar({ editor }: { editor: TiptapEditor | null }) {
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

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!activeCommentId) return
    const el = itemRefs.current[activeCommentId]
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [activeCommentId])

  return (
    <div
      className="min-h-0 max-h-[min(58svh,32rem)] overflow-y-auto pr-1"
      data-redlines-sidebar=""
      aria-label="Redlines"
    >
      <div className="space-y-1.5 py-1">
        {showNewComment && (
          <NewCommentDraft
            key={draftQuotedText}
            quotedText={draftQuotedText}
            onSubmit={handleSubmitNewComment}
            onCancel={handleCloseNewComment}
          />
        )}

        {ordered.length === 0 && !showNewComment && (
          <p className="text-muted-foreground py-2 text-[12px] leading-snug">
            Select text, then add a comment or{" "}
            <Kbd className="text-[10px]">⌘⇧M</Kbd>. Open redlines with the
            toolbar or <Kbd className="text-[10px]">⌘⇧L</Kbd> to browse threads.
          </p>
        )}

        {ordered.map((comment, i) => {
          const dimForLink =
            linkHighlightId !== null && linkHighlightId !== comment.id
          return (
            <div
              key={comment.id}
              data-comment-thread-id={comment.id}
              ref={(el) => {
                itemRefs.current[comment.id] = el
              }}
              className={cn(
                "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                dimForLink && "opacity-[0.35]",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
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
      </div>
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
        <blockquote className="mb-2 text-muted-foreground border-l-2 border-border/70 pl-2.5 text-[11px] leading-snug italic line-clamp-2">
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
          className="text-muted-foreground border-l-2 border-border/70 pl-2.5 text-[11px] leading-snug italic line-clamp-2"
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
      <blockquote className="text-muted-foreground border-l-2 border-border/50 pl-2.5 text-[11px] leading-snug italic line-clamp-2">
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

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/hooks/use-comments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Kbd } from "@/components/ui/kbd"

interface CommentSidebarProps {
  editor: TiptapEditor | null
  comments: Comment[]
  showNewComment: boolean
  draftQuotedText: string
  onCloseNewComment: () => void
  onSubmitNewComment: (body: string) => void
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  addReplyToComment: (commentId: string, body: string) => void
  deleteComment: (editor: TiptapEditor, commentId: string) => void
}

export function CommentSidebar({
  editor,
  comments,
  showNewComment,
  draftQuotedText,
  onCloseNewComment,
  onSubmitNewComment,
  activeCommentId,
  setActiveCommentId,
  addReplyToComment,
  deleteComment,
}: CommentSidebarProps) {
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
    <div className="min-h-0 max-h-[min(58svh,32rem)] overflow-y-auto pr-1">
      <div className="space-y-0">
        {showNewComment && (
          <NewCommentDraft
            key={draftQuotedText}
            quotedText={draftQuotedText}
            onSubmit={onSubmitNewComment}
            onCancel={onCloseNewComment}
          />
        )}

        {ordered.length === 0 && !showNewComment && (
          <p className="text-muted-foreground py-2 text-[12px] leading-snug">
            Select text, then Comment or{" "}
            <Kbd className="text-[10px]">⌘⇧M</Kbd>.
          </p>
        )}

        {ordered.map((comment) => (
          <div
            key={comment.id}
            ref={(el) => {
              itemRefs.current[comment.id] = el
            }}
            className="border-border/60 border-b py-2 last:border-b-0"
          >
            <ThreadRow
              comment={comment}
              isActive={activeCommentId === comment.id}
              onSelect={() => setActiveCommentId(comment.id)}
              onReply={(body) => addReplyToComment(comment.id, body)}
              onDelete={() => {
                if (editor) deleteComment(editor, comment.id)
              }}
              onCloseThread={() => setActiveCommentId(null)}
            />
          </div>
        ))}
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
    <div className="border-border/80 space-y-2 border-b pb-4">
      {quotedText ? (
        <blockquote className="text-muted-foreground border-border/70 bg-muted/30 rounded-r-md border-l-2 px-2 py-1 text-[11px] leading-snug italic">
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
        className="resize-none text-[13px]"
      />
      <div className="flex justify-end gap-1.5">
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

function ThreadRow({
  comment,
  isActive,
  onSelect,
  onReply,
  onDelete,
  onCloseThread,
}: {
  comment: Comment
  isActive: boolean
  onSelect: () => void
  onReply: (body: string) => void
  onDelete: () => void
  onCloseThread: () => void
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
    if (e.key === "Escape") onCloseThread()
  }

  if (isActive) {
    return (
      <article
        className="space-y-2 rounded-lg bg-muted/40 p-2"
        aria-labelledby={`comment-${comment.id}-quote`}
      >
        <blockquote
          id={`comment-${comment.id}-quote`}
          className="text-muted-foreground border-border/70 bg-muted/30 rounded-r-md border-l-2 px-2 py-1 text-[11px] leading-snug italic"
        >
          {comment.quotedText}
        </blockquote>
        <div className="space-y-1.5">
          {comment.messages.map((message, index) => (
            <p
              key={message.id}
              className={
                index === 0
                  ? "rounded-md bg-background/85 px-2 py-1.5 text-[12px] leading-relaxed whitespace-pre-wrap"
                  : "rounded-md bg-background/70 px-2 py-1.5 text-[12px] leading-relaxed whitespace-pre-wrap"
              }
            >
              {message.body}
            </p>
          ))}
        </div>
        <Textarea
          autoFocus
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Reply to comment thread"
          rows={2}
          placeholder="Reply…"
          className="resize-none text-[12px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive/90 hover:text-destructive h-7 px-2 text-[11px]"
            onClick={onDelete}
          >
            Delete thread
          </Button>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 px-2 text-[11px]"
              onClick={onCloseThread}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={handleReply}
            >
              Reply
            </Button>
          </div>
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
      className="cursor-pointer rounded-md px-1 py-1.5 transition-[background-color] duration-150 ease-out hover:bg-muted/30"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <blockquote className="text-muted-foreground border-border/60 bg-muted/25 mb-1 rounded-r-md border-l-2 px-2 py-1 text-[11px] leading-snug italic">
        {comment.quotedText}
      </blockquote>
      <p className="text-[12px] leading-relaxed whitespace-pre-wrap">
        {latestMessage?.body}
      </p>
      <p className="text-muted-foreground mt-1 text-[10px]">
        {comment.messages.length} {comment.messages.length === 1 ? "message" : "messages"}
      </p>
    </div>
  )
}

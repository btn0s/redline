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
  updateCommentBody: (commentId: string, body: string) => void
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
  updateCommentBody,
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
            className="border-border/80 border-b last:border-b-0"
          >
            <ThreadRow
              comment={comment}
              isActive={activeCommentId === comment.id}
              onSelect={() => setActiveCommentId(comment.id)}
              onUpdateBody={(body) => {
                updateCommentBody(comment.id, body)
                setActiveCommentId(null)
              }}
              onDelete={() => {
                if (editor) deleteComment(editor, comment.id)
              }}
              onCloseEdit={() => setActiveCommentId(null)}
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
        <p className="text-muted-foreground text-[12px] leading-snug italic">
          {quotedText}
        </p>
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
  onUpdateBody,
  onDelete,
  onCloseEdit,
}: {
  comment: Comment
  isActive: boolean
  onSelect: () => void
  onUpdateBody: (body: string) => void
  onDelete: () => void
  onCloseEdit: () => void
}) {
  const [editBody, setEditBody] = useState(comment.body)

  useEffect(() => {
    setEditBody(comment.body)
  }, [comment.id, comment.body])

  const handleSave = () => {
    const trimmed = editBody.trim()
    if (!trimmed) return
    onUpdateBody(trimmed)
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") onCloseEdit()
  }

  if (isActive) {
    return (
      <article
        className="-mx-1 rounded-md bg-muted/50 px-1 py-3"
        aria-labelledby={`comment-${comment.id}-quote`}
      >
        <p
          id={`comment-${comment.id}-quote`}
          className="text-muted-foreground mb-1.5 text-[12px] leading-snug italic"
        >
          {comment.quotedText}
        </p>
        <Textarea
          autoFocus
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Edit comment"
          rows={3}
          className="resize-none text-[13px]"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="text-destructive/90 hover:text-destructive text-[11px]"
            onClick={onDelete}
          >
            Delete
          </button>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={onCloseEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
            >
              Save
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
      className="-mx-1 cursor-pointer rounded-md px-1 py-3 transition-colors hover:bg-muted/30"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <p className="text-muted-foreground mb-1.5 text-[12px] leading-snug italic">
        {comment.quotedText}
      </p>
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
        {comment.body}
      </p>
    </div>
  )
}

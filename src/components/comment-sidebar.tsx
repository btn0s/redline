import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { MessageSquare } from "lucide-react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/types/comment"
import { useCommentContext } from "@/contexts/comment-context"
import { resolveCommentLinkHighlightId } from "@/extensions/comment-mark"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { modDeleteChord, modEnterChord } from "@/lib/format-shortcut"
import { isModKey } from "@/lib/mod-key"
import { useCommentSidebarLayout } from "@/hooks/use-comment-sidebar-layout"

const STICKY_ROTATIONS = [-1.2, 0.9, -0.5, 1.4, -0.8, 0.6, -1.6, 1.1]
const STICKY_COLOR_CLASSES = [
  "",
  "sticky-note--pink",
  "",
  "sticky-note--blue",
  "",
  "sticky-note--green",
  "",
]

function stringHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function stickyRotationStyle(seed: string): CSSProperties {
  const idx = stringHash(seed) % STICKY_ROTATIONS.length
  return { ["--sticky-rotate" as string]: `${STICKY_ROTATIONS[idx]}deg` }
}

function stickyColorClass(seed: string): string {
  const idx = stringHash(seed) % STICKY_COLOR_CLASSES.length
  return STICKY_COLOR_CLASSES[idx] ?? ""
}

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

  // When the draft appears, suppress wrapper Y transition for the first paint so
  // the wrapper snaps to the anchored position. After that, re-enable the
  // transition so subsequent layout shifts (other comments moving) animate.
  const [draftYSettled, setDraftYSettled] = useState(false)
  const [prevShowNewComment, setPrevShowNewComment] = useState(showNewComment)
  if (prevShowNewComment !== showNewComment) {
    setPrevShowNewComment(showNewComment)
    setDraftYSettled(false)
  }
  useEffect(() => {
    if (!showNewComment || draftTop === null) return
    const id = requestAnimationFrame(() => setDraftYSettled(true))
    return () => cancelAnimationFrame(id)
  }, [showNewComment, draftTop])

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
              "absolute right-0 top-0 -left-14 will-change-transform",
              layoutReady &&
                !reduceMotion &&
                "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "transition-[filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              dimForLink && "brightness-[0.62]",
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
          data-comment-draft=""
          className={cn(
            "absolute right-0 top-0 -left-14 will-change-transform",
            layoutReady &&
              !reduceMotion &&
              draftYSettled &&
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
    if (e.key === "Enter" && isModKey(e)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") onCancel()
  }

  const pinChord = modEnterChord()

  return (
    <div
      className="sticky-with-actions"
      style={{ ["--sticky-rotate" as string]: "-1.2deg" }}
    >
      <div className="sticky-note comment-draft-enter">
        {quotedText ? (
          <>
            <blockquote className="text-caption leading-snug text-[color:var(--sticky-foreground)]/70 not-italic line-clamp-2">
              {"\u201C"}
              {quotedText}
              {"\u201D"}
            </blockquote>
            <hr className="sticky-dashed" aria-hidden />
          </>
        ) : null}
        <Textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jot something…"
          aria-label="New comment"
          rows={3}
          className="sticky-handwritten resize-none border-0 bg-transparent text-[color:var(--sticky-foreground)] placeholder:text-[color:var(--sticky-foreground)]/50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-0"
        />
      </div>
      <div className="sticky-action-bar" role="toolbar" aria-label="New comment actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "sticky-skeuo-btn sticky-skeuo-btn--neutral",
            "gap-2 px-2.5 text-xs active:!translate-y-0",
          )}
          aria-keyshortcuts="Escape"
          onClick={onCancel}
        >
          <span className="inline-flex items-center gap-2">
            Cancel
            <span
              className="sticky-skeuo-shortcut sticky-skeuo-shortcut--neutral sticky-skeuo-shortcut--chord"
              aria-hidden
            >
              Esc
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "sticky-skeuo-btn sticky-skeuo-btn--primary",
            "gap-2 px-2.5 text-xs active:!translate-y-0",
          )}
          onClick={handleSubmit}
        >
          <span className="inline-flex items-center gap-2">
            Pin it
            <span
              className="sticky-skeuo-shortcut sticky-skeuo-shortcut--primary sticky-skeuo-shortcut--chord"
              aria-hidden
            >
              <span className="sticky-skeuo-shortcut-mod">{pinChord.mod}</span>
              {pinChord.joiner != null ? (
                <span className="sticky-skeuo-shortcut-joiner">{pinChord.joiner}</span>
              ) : null}
              <span className="sticky-skeuo-shortcut-key">{pinChord.key}</span>
            </span>
          </span>
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
    if (e.key === "Enter" && isModKey(e)) {
      e.preventDefault()
      handleReply()
      return
    }
    if (e.key === "Delete" && isModKey(e)) {
      e.preventDefault()
      onDelete()
    }
  }

  const rotateStyle = stickyRotationStyle(comment.id)
  const colorClass = stickyColorClass(comment.id)
  const replyChord = modEnterChord()
  const deleteChord = modDeleteChord()

  if (isActive) {
    return (
      <div className={cn("sticky-with-actions", colorClass)} style={rotateStyle}>
        <article
          className={cn("sticky-note sticky-note--active", colorClass)}
          aria-labelledby={`comment-${comment.id}-quote`}
        >
          <blockquote
            id={`comment-${comment.id}-quote`}
            className="text-caption leading-snug text-[color:var(--sticky-foreground)]/70 not-italic line-clamp-2"
          >
            {"\u201C"}
            {comment.quotedText}
            {"\u201D"}
          </blockquote>
          <hr className="sticky-dashed" aria-hidden />

          <div className="space-y-1.5">
            {comment.messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "sticky-handwritten whitespace-pre-wrap text-[color:var(--sticky-foreground)]",
                  index === 0
                    ? ""
                    : "ml-3 border-l border-[color:var(--sticky-foreground)]/20 pl-2.5",
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
              className="sticky-handwritten resize-none border-0 bg-transparent p-0 text-[color:var(--sticky-foreground)] placeholder:text-[color:var(--sticky-foreground)]/50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            />
          </div>
        </article>
        <div className="sticky-action-bar" role="toolbar" aria-label="Thread actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "sticky-skeuo-btn sticky-skeuo-btn--neutral",
              "gap-2 px-2.5 text-xs active:!translate-y-0",
            )}
            onClick={onDelete}
            aria-label="Delete thread"
          >
            <span className="inline-flex items-center gap-2">
              Delete
              <span
                className="sticky-skeuo-shortcut sticky-skeuo-shortcut--neutral sticky-skeuo-shortcut--chord"
                aria-hidden
              >
                <span className="sticky-skeuo-shortcut-mod">{deleteChord.mod}</span>
                {deleteChord.joiner != null ? (
                  <span className="sticky-skeuo-shortcut-joiner">{deleteChord.joiner}</span>
                ) : null}
                <span className="sticky-skeuo-shortcut-key">{deleteChord.key}</span>
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "sticky-skeuo-btn sticky-skeuo-btn--primary",
              "gap-2 px-2.5 text-xs active:!translate-y-0",
            )}
            onClick={handleReply}
          >
            <span className="inline-flex items-center gap-2">
              Reply
              <span
                className="sticky-skeuo-shortcut sticky-skeuo-shortcut--primary sticky-skeuo-shortcut--chord"
                aria-hidden
              >
                <span className="sticky-skeuo-shortcut-mod">{replyChord.mod}</span>
                {replyChord.joiner != null ? (
                  <span className="sticky-skeuo-shortcut-joiner">{replyChord.joiner}</span>
                ) : null}
                <span className="sticky-skeuo-shortcut-key">{replyChord.key}</span>
              </span>
            </span>
          </Button>
        </div>
      </div>
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
      className={cn("sticky-note sticky-note--pressable", colorClass)}
      style={rotateStyle}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <blockquote className="text-caption leading-snug text-[color:var(--sticky-foreground)]/70 not-italic line-clamp-2">
        {"\u201C"}
        {comment.quotedText}
        {"\u201D"}
      </blockquote>
      <hr className="sticky-dashed" aria-hidden />
      <p className="sticky-handwritten whitespace-pre-wrap line-clamp-3 text-[color:var(--sticky-foreground)]">
        {latestMessage?.body}
      </p>
      {comment.messages.length > 1 && (
        <div className="mt-1.5 flex items-center gap-1 text-[color:var(--sticky-foreground)]/60">
          <MessageSquare className="size-3" />
          <span className="text-[10px]">
            {comment.messages.length} replies
          </span>
        </div>
      )}
    </div>
  )
})

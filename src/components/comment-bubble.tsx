import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import type { Comment } from "@/hooks/use-comments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"

interface CommentBubbleProps {
  comment?: Comment
  position: { top: number; left: number }
  onSubmit: (body: string) => void
  onDelete: () => void
  onClose: () => void
}

export function CommentBubble({
  comment,
  position,
  onSubmit,
  onDelete,
  onClose,
}: CommentBubbleProps) {
  const [body, setBody] = useState(comment?.body ?? "")

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div
      className="fixed z-[100] w-72 max-w-[calc(100vw-1.5rem)]"
      style={{ top: position.top, left: position.left }}
    >
      <Card className="shadow-lg">
        {comment && (
          <CardHeader className="pb-0">
            <p className="truncate text-xs text-muted-foreground">
              &ldquo;{comment.quotedText}&rdquo;
            </p>
          </CardHeader>
        )}
        <CardContent className={comment ? "pt-2" : "pt-4"}>
          <Textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            rows={3}
            className="resize-none"
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 border-t pt-3">
          <div>
            {comment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSubmit}>
              {comment ? "Update" : "Save"}{" "}
              <Kbd className="ml-1.5 text-muted-foreground">⌘↵</Kbd>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

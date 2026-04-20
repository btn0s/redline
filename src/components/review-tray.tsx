import { useRef } from "react"
import { ChevronDown, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCommentContext } from "@/contexts/comment-context"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChordModShiftCompact } from "@/components/shortcut-glyph-chords"
import {
  reviewTrayActions,
  reviewTrayBody,
  reviewTrayChevron,
  reviewTrayClip,
  reviewTrayContainer,
  reviewTrayCount,
  reviewTrayHeader,
  reviewTrayHeaderButton,
  reviewTraySubmitLabel,
  reviewTrayTextarea,
} from "@/components/review-tray-styles"

export function ReviewTray() {
  const {
    comments,
    summary,
    setSummary,
    isReviewTrayCollapsed,
    setReviewTrayCollapsed,
    submitReview,
    showReviewTray,
  } = useCommentContext()

  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  if (!showReviewTray) return null

  const count = comments.length
  const countLabel = `${count} note${count === 1 ? "" : "s"}`
  const collapsed = isReviewTrayCollapsed

  const handleHeaderClick = () => {
    setReviewTrayCollapsed(!collapsed)
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await submitReview()
    } catch (e) {
      console.error(e)
      toast.error("Failed to copy review")
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div
      className={cn(reviewTrayContainer)}
      data-collapsed={collapsed ? "true" : "false"}
      data-prevent-redlines-dismiss=""
      role="region"
      aria-label="Review"
    >
      <div className={reviewTrayHeader}>
        <button
          type="button"
          className={reviewTrayHeaderButton}
          onClick={handleHeaderClick}
          aria-expanded={!collapsed}
          aria-controls="review-tray-body"
        >
          <Paperclip className={reviewTrayClip} aria-hidden />
          <span>Review</span>
          <span className={reviewTrayCount} aria-label={countLabel}>
            {countLabel}
          </span>
          <ChevronDown className={reviewTrayChevron} aria-hidden />
        </button>
      </div>
      {!collapsed ? (
        <div className={reviewTrayBody} id="review-tray-body">
          <textarea
            ref={textareaRef}
            className={reviewTrayTextarea}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="summary of this review…"
            aria-label="Review summary"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation()
                textareaRef.current?.blur()
              }
            }}
          />
          <div className={reviewTrayActions}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="sticky-skeuo-btn"
                    onClick={() => void handleSubmit()}
                    aria-label="Submit review — copies to clipboard"
                  >
                    <span className={reviewTraySubmitLabel}>Submit review</span>
                  </Button>
                }
              />
              <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
                <span>Submit review</span>
                <Kbd>
                  <ChordModShiftCompact letter="C" />
                </Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useRef } from "react"
import { Paperclip, X } from "lucide-react"
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
  reviewTrayClip,
  reviewTrayCount,
  reviewTrayHeader,
  reviewTrayHeaderLeading,
  reviewTrayIconBtn,
  reviewTrayScroll,
  reviewTraySheetCard,
  reviewTraySubmitLabel,
  reviewTraySummaryBlock,
  reviewTrayTextarea,
} from "@/components/review-tray-styles"

export function ReviewTray() {
  const {
    comments,
    summary,
    setSummary,
    submitReview,
    hasComments,
    finishReviewOpen,
    setFinishReviewOpen,
  } = useCommentContext()

  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!finishReviewOpen || !hasComments) return
    const t = window.setTimeout(() => textareaRef.current?.focus(), 100)
    return () => window.clearTimeout(t)
  }, [finishReviewOpen, hasComments])

  useEffect(() => {
    if (!finishReviewOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      setFinishReviewOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [finishReviewOpen, setFinishReviewOpen])

  if (!hasComments || !finishReviewOpen) return null

  const count = comments.length
  const countLabel = `${count} note${count === 1 ? "" : "s"}`

  const close = () => setFinishReviewOpen(false)

  const handleSubmit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const ok = await submitReview()
      if (ok) setFinishReviewOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("Failed to copy review")
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div
      className="finish-review-root fixed inset-0 z-[60] flex flex-col justify-end pt-[min(35vh,10rem)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-sheet-title"
      data-prevent-redlines-dismiss=""
    >
      <button
        type="button"
        className="finish-review-backdrop animate-in fade-in-0 absolute inset-0 z-0 cursor-default bg-black/35 duration-[240ms] ease-out"
        aria-label="Dismiss finish review"
        onClick={close}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-md justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
        <div
          className={cn(
            reviewTraySheetCard,
            "finish-review-panel animate-in fade-in-0 slide-in-from-bottom-6 duration-[240ms] ease-out",
          )}
        >
          <div className={reviewTrayHeader}>
            <div className={reviewTrayHeaderLeading}>
              <Paperclip className={reviewTrayClip} aria-hidden />
              <span id="review-sheet-title">Review</span>
              <span className={reviewTrayCount} aria-label={countLabel}>
                {countLabel}
              </span>
            </div>
            <button
              type="button"
              className={reviewTrayIconBtn}
              aria-label="Close"
              onClick={close}
            >
              <X className="size-3.5 stroke-[1.5]" aria-hidden />
            </button>
          </div>
          <div className={reviewTrayScroll}>
            <div className={reviewTraySummaryBlock}>
              <label
                className="review-tray-cover-label"
                htmlFor="review-tray-summary"
              >
                Cover summary
              </label>
              <textarea
                id="review-tray-summary"
                ref={textareaRef}
                className={reviewTrayTextarea}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional summary for this review…"
                aria-label="Review summary"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation()
                    textareaRef.current?.blur()
                  }
                }}
              />
            </div>
          </div>
          <div className={reviewTrayActions}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    className="sticky-skeuo-btn h-6 px-2.5 text-[0.65rem]"
                    onClick={() => void handleSubmit()}
                    aria-label="Copy review to clipboard"
                  >
                    <span className={reviewTraySubmitLabel}>
                      Copy review
                    </span>
                  </Button>
                }
              />
              <TooltipContent
                side="top"
                sideOffset={8}
                className="flex flex-wrap items-center gap-1.5"
              >
                <span>Copy formatted review</span>
                <Kbd>
                  <ChordModShiftCompact letter="C" />
                </Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

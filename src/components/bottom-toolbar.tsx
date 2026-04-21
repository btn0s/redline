import { useState } from "react"
import { CircleHelp, ClipboardCheck, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommentContext } from "@/contexts/comment-context"
import { ThemeCycleButton } from "@/components/theme-cycle-button"
import { ReviewHelpDialog } from "@/components/review-help-dialog"
import { ReviewSettingsDialog } from "@/components/review-settings-dialog"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChordModShiftAlt } from "@/components/shortcut-glyph-chords"
import { REVIEW_MD_CLEAR_ALL_COMMENTS } from "@/lib/review-md-events"

const toolbarBtnClass =
  "h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full active:scale-[0.97]"

export function BottomToolbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { hasComments, setFinishReviewOpen } = useCommentContext()

  const requestClearAll = () => {
    window.dispatchEvent(new CustomEvent(REVIEW_MD_CLEAR_ALL_COMMENTS))
  }

  return (
    <>
      <ReviewSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReviewHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div
        className={cn(
          "desk-toolbar pointer-events-auto flex items-center gap-1 px-1.5 py-1 text-popover-foreground",
        )}
        role="toolbar"
        data-prevent-redlines-dismiss=""
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasComments}
                aria-label="Finish review — open summary and copy"
                className="sticky-skeuo-btn !rounded-full h-8 shrink-0 gap-1.5 px-3 pl-2.5 text-[0.65rem] font-medium active:scale-[0.97]"
                onClick={() => setFinishReviewOpen(true)}
              >
                <ClipboardCheck className="size-3.5 shrink-0 stroke-[1.5]" aria-hidden />
                Finish review
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            Summary and copy formatted review to the clipboard
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                disabled={!hasComments}
                aria-label="Delete all threads"
                className={toolbarBtnClass}
                onClick={requestClearAll}
              >
                <Trash2 className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
            <span>Delete all threads</span>
            <Kbd>
              <ChordModShiftAlt letter="C" />
            </Kbd>
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          variant="engraved"
          className="mx-1"
        />

        <ThemeCycleButton />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="Settings"
                className={toolbarBtnClass}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            Shortcuts and keyboard layout
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="What is redline?"
                className={toolbarBtnClass}
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            What is redline?
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}

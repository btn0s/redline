import { Copy, MessagesSquare, Trash2 } from "lucide-react"
import { useCommentContext } from "@/contexts/comment-context"
import { ThemeCycleButton } from "@/components/theme-cycle-button"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  modShiftAltKey,
  modShiftKeyCompact,
} from "@/lib/format-shortcut"

const toolbarBtnClass =
  "h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"

export function BottomToolbar() {
  const { commentsPanelOpen, togglePanel, hasComments, copyComments, clearAllComments } =
    useCommentContext()

  return (
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle redlines panel"
                aria-pressed={commentsPanelOpen}
                className={toolbarBtnClass}
                onClick={togglePanel}
              >
                <MessagesSquare className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="max-w-[17rem] flex-col gap-1.5">
            <span>Redlines — browse all comment threads in the side panel.</span>
            <span className="flex flex-wrap items-center gap-1">
              <Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd>
            </span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!hasComments}
                aria-label="Copy all comments"
                className={toolbarBtnClass}
                onClick={() => void copyComments()}
              >
                <Copy className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="max-w-[16rem] flex-col gap-1.5">
            <span>Copy every thread as plain text to the clipboard.</span>
            <span className="flex flex-wrap items-center gap-1">
              <Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>
              <span className="text-[10px] opacity-80">
                (from the editor, or anywhere outside a text field)
              </span>
            </span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!hasComments}
                aria-label="Clear all comments"
                className={toolbarBtnClass}
                onClick={clearAllComments}
              >
                <Trash2 className="size-3.5 stroke-[1.5]" aria-hidden />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="max-w-[17rem] flex-col gap-1.5">
            <span>Remove all comment threads from this document (asks for confirmation).</span>
            <span className="flex flex-wrap items-center gap-1">
              <Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>
            </span>
          </TooltipContent>
        </Tooltip>

        <ThemeCycleButton />
      </div>
    </div>
  )
}

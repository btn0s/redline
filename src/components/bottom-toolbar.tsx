import { useEffect, useRef, useState } from "react"
import { CircleCheck, CircleHelp, Copy, MessagesSquare, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommentContext } from "@/contexts/comment-context"
import { ThemeCycleButton } from "@/components/theme-cycle-button"
import { ReviewHelpDialog } from "@/components/review-help-dialog"
import { ReviewSettingsDialog } from "@/components/review-settings-dialog"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { modShiftAltKey, modShiftKeyCompact } from "@/lib/format-shortcut"

const toolbarBtnClass =
  "h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"

export function BottomToolbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { commentsPanelOpen, togglePanel, hasComments, copyComments, clearAllComments } =
    useCommentContext()

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
    }
  }, [])

  const handleCopyClick = async () => {
    const ok = await copyComments()
    if (!ok) return
    setCopied(true)
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
    copyResetTimerRef.current = setTimeout(() => setCopied(false), 1600)
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
                  aria-label="Toggle comment threads panel"
                  aria-pressed={commentsPanelOpen}
                  className={toolbarBtnClass}
                  onClick={togglePanel}
                >
                  <MessagesSquare className="size-3.5 stroke-[1.5]" aria-hidden />
                </Button>
              }
            />
            <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
              <span>Open comment threads</span>
              <Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd>
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
                  aria-label={copied ? "Copied" : "Copy review as prompt"}
                  aria-live="polite"
                  className={toolbarBtnClass}
                  onClick={() => void handleCopyClick()}
                >
                  <span className="relative inline-flex size-3.5 items-center justify-center">
                    <Copy
                      className={cn(
                        "absolute inset-0 size-3.5 stroke-[1.5] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
                      )}
                      aria-hidden
                    />
                    <CircleCheck
                      className={cn(
                        "absolute inset-0 size-3.5 stroke-[1.75] text-emerald-500 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:text-emerald-400",
                        copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
                      )}
                      aria-hidden
                    />
                  </span>
                </Button>
              }
            />
            <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
              <span>Copy review as prompt</span>
              <Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>
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
                  aria-label="Delete all threads"
                  className={toolbarBtnClass}
                  onClick={clearAllComments}
                >
                  <Trash2 className="size-3.5 stroke-[1.5]" aria-hidden />
                </Button>
              }
            />
            <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
              <span>Delete all threads</span>
              <Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>
            </TooltipContent>
          </Tooltip>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-hidden="true"
            className="mx-1.5 h-5 w-px shrink-0 bg-border/80"
          />

          <ThemeCycleButton />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
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
                  variant="ghost"
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
      </div>
    </>
  )
}

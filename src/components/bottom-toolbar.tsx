import { Copy, MessagesSquare, Settings } from "lucide-react"
import { ThemeCycleButton } from "@/components/theme-cycle-button"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BottomToolbarProps {
  commentsPanelOpen: boolean
  onTogglePanel: () => void
  hasComments: boolean
  onCopyComments: () => void
  commentsCount: number
}

export function BottomToolbar({
  commentsPanelOpen,
  onTogglePanel,
  hasComments,
  onCopyComments,
  commentsCount,
}: BottomToolbarProps) {
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
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Redlines — browse all comment threads (⌘⇧L / Ctrl+Shift+L)"
          aria-label="Toggle redlines panel"
          aria-pressed={commentsPanelOpen}
          className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
          onClick={onTogglePanel}
        >
          <MessagesSquare className="size-3.5 stroke-[1.5]" aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!hasComments}
          onClick={() => void onCopyComments()}
          title="Copy all comments"
          aria-label="Copy all comments"
          className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
        >
          <Copy className="size-3.5 stroke-[1.5]" aria-hidden />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground outline-none transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] dark:text-zinc-400 dark:focus-visible:ring-white/30"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="size-3.5 stroke-[1.5]" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" sideOffset={8}>
            <DropdownMenuLabel>review-md</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Comments: {commentsCount}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs">
              Redlines panel:{" "}
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono">⌘⇧L</kbd> /{" "}
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono">
                Ctrl+Shift+L
              </kbd>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs">
              Theme:{" "}
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono">D</kbd> when
              not editing text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeCycleButton />
      </div>
    </div>
  )
}

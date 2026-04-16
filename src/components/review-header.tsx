import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReviewHeaderProps {
  filePath: string
  isOutdated: boolean
  saving: boolean
  onOutdatedClick: () => void
}

const HANDLE_RIGHT = "@btn0s/review-md"

export function ReviewHeader({
  filePath,
  isOutdated,
  saving,
  onOutdatedClick,
}: ReviewHeaderProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-backdrop-filter:bg-background/70"
      aria-label="Current file and repository"
      data-prevent-redlines-dismiss=""
    >
      <div className="flex h-9 min-h-9 items-center justify-between gap-3 px-4 text-[11px] leading-none">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="truncate font-mono text-muted-foreground"
            title={filePath}
          >
            {filePath}
          </span>
          {isOutdated ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-5 shrink-0 rounded-full px-2 py-0 text-[0.625rem] font-medium"
              onClick={onOutdatedClick}
              title="File changed on disk — reload clears comments and loads latest"
            >
              Outdated · Reload
            </Button>
          ) : null}
          {saving && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center text-muted-foreground"
            >
              <span className="sr-only">Saving</span>
              <Loader2
                className="size-3 shrink-0 animate-spin opacity-80"
                aria-hidden
              />
            </span>
          )}
        </div>
        <span
          className="shrink-0 font-mono text-muted-foreground tabular-nums"
          title={HANDLE_RIGHT}
        >
          {HANDLE_RIGHT}
        </span>
      </div>
    </header>
  )
}

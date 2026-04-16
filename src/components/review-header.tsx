import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const REDLINE_REPO_URL = "https://github.com/btn0s/redline"
export const BTN0S_TWITTER_URL = "https://twitter.com/btn0s"

const linkClass =
  "font-mono text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"

interface ReviewHeaderProps {
  isOutdated: boolean
  saving: boolean
  onOutdatedClick: () => void
}

export function ReviewHeader({
  isOutdated,
  saving,
  onOutdatedClick,
}: ReviewHeaderProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]"
      aria-label="Review"
      data-prevent-redlines-dismiss=""
    >
      <div className="flex h-9 min-h-9 items-center justify-between gap-3 px-4 text-xs leading-none">
        <a
          href={REDLINE_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("min-w-0 shrink", linkClass)}
        >
          @btn0s/redline
        </a>

        <div className="flex min-w-0 items-center gap-3">
          <a
            href={BTN0S_TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Twitter
          </a>
          <a
            href={REDLINE_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub
          </a>
          {isOutdated ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-5 shrink-0 rounded-full px-2 py-0 text-xs font-medium"
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
      </div>
    </header>
  )
}

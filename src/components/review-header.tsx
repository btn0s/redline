import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const REDLINE_REPO_URL = "https://github.com/btn0s/redline"

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
      <div className="relative flex h-9 min-h-9 items-center justify-end gap-2 px-4 text-[0.75rem] leading-none">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <a
            href={REDLINE_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tape-strip pointer-events-auto font-mono text-[0.8125rem] text-foreground/90 underline-offset-4 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground hover:underline"
          >
            @btn0s/redline
          </a>
        </div>
        {isOutdated ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative z-10 h-5 shrink-0 rounded-full px-2 py-0 text-[0.625rem] font-medium"
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
            className="relative z-10 inline-flex items-center text-muted-foreground"
          >
            <span className="sr-only">Saving</span>
            <Loader2
              className="size-3 shrink-0 animate-spin opacity-80"
              aria-hidden
            />
          </span>
        )}
      </div>
    </header>
  )
}

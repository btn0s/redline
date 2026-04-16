import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { useShortcutScheme } from "@/contexts/shortcut-scheme-context"
import {
  ChordModAltCompact,
  ChordModShiftAlt,
  ChordModShiftCompact,
  ChordNewCommentShortcut,
} from "@/components/shortcut-glyph-chords"
import { cn } from "@/lib/utils"
import {
  dialogBody,
  dialogHeaderBlock,
  dialogLead,
  dialogMonoLink,
  dialogSection,
  dialogSectionLast,
  dialogSectionTitle,
  dialogScrollableSurface,
  dialogShortcutList,
  dialogShortcutRow,
} from "@/components/review-dialog-styles"
import { BTN0S_TWITTER_URL, REDLINE_REPO_URL } from "@/components/review-header"

const CURSOR_URL = "https://cursor.com"

interface ReviewHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Opens Settings (parent should close help). */
  onOpenSettings?: () => void
}

function Row({ label, keys }: { label: string; keys: ReactNode }) {
  return (
    <div className={dialogShortcutRow}>
      <span className={cn(dialogBody, "min-w-0 flex-1")}>{label}</span>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">{keys}</div>
    </div>
  )
}

export function ReviewHelpDialog({
  open,
  onOpenChange,
  onOpenSettings,
}: ReviewHelpDialogProps) {
  const { scheme } = useShortcutScheme()
  const newCommentLabel =
    scheme === "google-docs" ? "New comment (Google Docs style)" : "New comment (Notion style)"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={dialogScrollableSurface}
        data-prevent-redlines-dismiss=""
      >
        <div className={dialogHeaderBlock}>
          <DialogHeader className="text-left">
            <DialogTitle>Redline</DialogTitle>
            <DialogDescription className="sr-only">
              Redline: review markdown with anchored comments and keyboard shortcuts.
            </DialogDescription>
            <div className="space-y-2">
              <p className={dialogLead}>
                Review mode for LLM-generated plans — Docs-style comments on any{" "}
                <code className="desk-skeuo-pill desk-skeuo-pill--mono">.md</code>
                , then copy everything back to the LLM in one shot.
              </p>
              <p>
                <a
                  href={REDLINE_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(dialogMonoLink, "inline-block max-w-full break-all")}
                >
                  {REDLINE_REPO_URL}
                </a>
              </p>
            </div>
          </DialogHeader>
        </div>

        <div className={dialogSection}>
          <div className="space-y-2">
            <h3 className={dialogSectionTitle}>How to use</h3>
            <p className={dialogBody}>
              Select text → thread replies →{" "}
              <span className="font-medium text-foreground/90">Copy all</span>.
            </p>
          </div>
        </div>

        <div className={dialogSection}>
          <div className="space-y-2">
            <h3 className={dialogSectionTitle}>Shortcuts</h3>
            {onOpenSettings ? (
              <p className={dialogBody}>
                To customize these,{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 transition-colors duration-150 ease-out hover:underline"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenSettings()
                  }}
                >
                  open Settings
                </button>
                .
              </p>
            ) : null}
            <div className={dialogShortcutList}>
              <Row
                label={newCommentLabel}
                keys={
                  <Kbd variant="skeuo">
                    <ChordNewCommentShortcut scheme={scheme} />
                  </Kbd>
                }
              />
              <Row
                label="Copy all"
                keys={
                  <Kbd variant="skeuo">
                    <ChordModShiftCompact letter="C" />
                  </Kbd>
                }
              />
              <Row
                label="Clear all"
                keys={
                  <Kbd variant="skeuo">
                    <ChordModShiftAlt letter="C" />
                  </Kbd>
                }
              />
              <Row
                label="Theme"
                keys={
                  <Kbd variant="skeuo">
                    <ChordModAltCompact letter="T" />
                  </Kbd>
                }
              />
            </div>
          </div>
        </div>

        <div className={dialogSectionLast}>
          <p className={cn(dialogBody, "text-center")}>
            <span className="font-sans">Handcrafted by </span>
            <a
              href={BTN0S_TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                dialogMonoLink,
                "font-semibold text-foreground/90 hover:text-foreground",
              )}
            >
              btn0s
            </a>
            <span className="font-sans"> and </span>
            <a
              href={CURSOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                dialogMonoLink,
                "font-semibold text-foreground/90 hover:text-foreground",
              )}
            >
              Cursor
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

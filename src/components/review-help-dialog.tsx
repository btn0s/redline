import type { ReactNode } from "react"
import { useShortcutScheme } from "@/contexts/shortcut-scheme-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import {
  addCommentShortcutDisplay,
  modAltKey,
  modAltKeyCompact,
  modShiftAltKey,
  modShiftKeyCompact,
} from "@/lib/format-shortcut"
import { modLabel } from "@/lib/mod-key"

interface ReviewHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Row({ label, keys }: { label: string; keys: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-1">{keys}</div>
    </div>
  )
}

export function ReviewHelpDialog({ open, onOpenChange }: ReviewHelpDialogProps) {
  const { scheme } = useShortcutScheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90svh,32rem)] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"
        data-prevent-redlines-dismiss=""
      >
        <div className="p-4 pb-3">
          <DialogHeader>
            <DialogTitle>Redline</DialogTitle>
            <DialogDescription className="sr-only">
              Redline: review markdown with anchored comments and keyboard shortcuts.
            </DialogDescription>
            <div className="space-y-2 text-left text-xs/relaxed text-muted-foreground">
              <p className="text-foreground/95 font-medium leading-snug">
                Review mode for LLM-generated plans — Docs-style comments on any{" "}
                <code className="rounded bg-muted px-1 py-px font-mono text-[0.65rem]">
                  .md
                </code>
                , then copy everything back to the LLM in one shot.
              </p>
              <p className="leading-snug">
                <span className="text-foreground/90">Flow:</span> select text → thread
                replies → <span className="text-foreground/90">Copy all</span>. Comments
                persist with the file.
              </p>
              <p className="text-[11px] leading-snug">
                Inspired by{" "}
                <a
                  href="https://agentation.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Agentation
                </a>
                .
              </p>
            </div>
          </DialogHeader>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-[11px] font-medium text-foreground">Shortcuts</p>
          <p className="text-muted-foreground mt-1 mb-2 text-[11px] leading-snug">
            <Kbd className="text-[10px]">{modLabel()}</Kbd> = ⌘ on Mac, Ctrl elsewhere.
            New comment now:{" "}
            <Kbd className="text-[10px]">{addCommentShortcutDisplay(scheme)}</Kbd> (
            <span className="text-foreground/90">gear</span> to switch).
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-2.5">
            <Row
              label="Comment (Docs / Word)"
              keys={<Kbd className="text-[10px]">{modAltKeyCompact("M")}</Kbd>}
            />
            <Row
              label="Comment (Notion)"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("M")}</Kbd>}
            />
            <Row
              label="Redlines panel"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd>}
            />
            <Row
              label="Copy all"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>}
            />
            <Row
              label="Clear all"
              keys={<Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>}
            />
            <Row label="Theme" keys={<Kbd className="text-[10px]">{modAltKey("T")}</Kbd>} />
          </div>
          <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
            Clear-all confirms before deleting threads.
          </p>
        </div>

        <div className="flex justify-end border-t border-border/60 px-4 py-3">
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

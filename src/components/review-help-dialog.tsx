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
        className="max-h-[min(90svh,40rem)] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"
        data-prevent-redlines-dismiss=""
      >
        <div className="p-4 pb-3">
          <DialogHeader>
            <DialogTitle>Redline</DialogTitle>
            <DialogDescription className="sr-only">
              Review mode for LLM-generated plans. Keyboard shortcuts and how Redline
              works.
            </DialogDescription>
            <div className="space-y-2.5 text-left text-xs/relaxed text-muted-foreground">
              <p className="text-foreground/95 font-medium">
                Review mode for LLM-generated plans.
              </p>
              <p>
                LLMs write plans and specs as markdown. Reviewing them in chat is
                imprecise — you end up quoting passages by hand, losing context, or just
                saying &quot;looks good&quot; when it doesn&apos;t. Redline gives you a
                Google Docs-style commenting experience on any{" "}
                <code className="rounded bg-muted px-1 py-px font-mono text-[0.65rem]">
                  .md
                </code>{" "}
                file so you can leave anchored, passage-level feedback. When you&apos;re
                done, copy all your comments in one click and paste them back into the
                LLM.
              </p>
              <p>
                <span className="font-medium text-foreground/90">The loop:</span> LLM
                writes a plan → you review it in Redline → your feedback goes back to the
                LLM.
              </p>
              <div>
                <p className="mb-1 font-medium text-foreground/90">How it works</p>
                <ol className="list-decimal space-y-1 pl-4 marker:text-muted-foreground">
                  <li>
                    <span className="text-foreground/90">Select text</span> in the
                    rendered markdown to start a comment thread
                  </li>
                  <li>
                    <span className="text-foreground/90">Leave comments</span> anchored to
                    the exact passage — replies are threaded
                  </li>
                  <li>
                    <span className="text-foreground/90">Copy all</span> — one click copies
                    every comment as structured text, ready to paste back into your LLM
                    conversation
                  </li>
                </ol>
                <p className="mt-2">
                  Comments persist to disk alongside the markdown so you can close and
                  come back.
                </p>
              </div>
              <p className="text-[11px]">
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
          <p className="text-[11px] font-medium text-foreground">Keyboard shortcuts</p>
          <p className="text-muted-foreground mt-1 mb-2 text-[11px] leading-snug">
            In the table, <Kbd className="text-[10px]">{modLabel()}</Kbd> is Command on
            Mac and Control on Windows / Linux. Your active new-comment chord is{" "}
            <Kbd className="text-[10px]">{addCommentShortcutDisplay(scheme)}</Kbd> (change
            it in settings).
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-2.5">
            <Row
              label="New comment (Docs / Word style)"
              keys={<Kbd className="text-[10px]">{modAltKeyCompact("M")}</Kbd>}
            />
            <Row
              label="New comment (Notion style)"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("M")}</Kbd>}
            />
            <Row
              label="Toggle redlines panel"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd>}
            />
            <Row
              label="Copy all comments"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>}
            />
            <Row
              label="Clear all comments"
              keys={<Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>}
            />
            <Row
              label="Cycle theme"
              keys={<Kbd className="text-[10px]">{modAltKey("T")}</Kbd>}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
            Use the <span className="text-foreground/90">gear</span> button to pick
            which new-comment shortcut is active. Clear-all asks for confirmation.
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

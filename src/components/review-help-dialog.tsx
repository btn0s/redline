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
            <DialogTitle>About Redline</DialogTitle>
            <DialogDescription className="text-left">
              Redline is a focused markdown reviewer: select text in the editor to
              start comment threads, browse them in the redlines panel, and keep
              feedback next to the source file. Your notes live with the document
              session (export via copy-all when you need plain text).
            </DialogDescription>
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

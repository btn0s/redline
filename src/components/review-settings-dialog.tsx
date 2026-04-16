import type { ReactNode } from "react"
import { useCommentContext } from "@/contexts/comment-context"
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  addCommentShortcutDisplay,
  modAltKey,
  modShiftAltKey,
  modShiftKeyCompact,
} from "@/lib/format-shortcut"
import type { ShortcutScheme } from "@/lib/shortcut-scheme"
import { cn } from "@/lib/utils"

interface ReviewSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ShortcutRow({ label, keys }: { label: string; keys: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-1">{keys}</div>
    </div>
  )
}

export function ReviewSettingsDialog({
  open,
  onOpenChange,
}: ReviewSettingsDialogProps) {
  const { scheme, setScheme } = useShortcutScheme()
  const { comments } = useCommentContext()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90svh,36rem)] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"
        data-prevent-redlines-dismiss=""
      >
        <div className="p-4 pb-3">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Review mode for LLM-generated plans — pick your new-comment shortcut and
              see the rest of the chord reference.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <Label className="text-[11px] font-medium text-foreground">
            New comment (with text selected)
          </Label>
          <p className="text-muted-foreground mt-1 mb-3 text-[11px] leading-snug">
            Match Google Docs / Word, or Notion’s block-comment shortcut.
          </p>
          <RadioGroup
            value={scheme}
            onValueChange={(v) => setScheme(v as ShortcutScheme)}
            className="gap-2"
          >
            <label
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 p-2.5 transition-colors",
                scheme === "google-docs" && "border-primary/50 bg-muted/40",
              )}
            >
              <RadioGroupItem value="google-docs" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium">Google Docs / Word</span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                  <Kbd className="text-[10px]">{addCommentShortcutDisplay("google-docs")}</Kbd>
                  <span>— same family as Docs (Ctrl+Alt+M / ⌘⌥M).</span>
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 p-2.5 transition-colors",
                scheme === "notion" && "border-primary/50 bg-muted/40",
              )}
            >
              <RadioGroupItem value="notion" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium">Notion</span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                  <Kbd className="text-[10px]">{addCommentShortcutDisplay("notion")}</Kbd>
                  <span>— same as Notion’s “create comment” chord.</span>
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-[11px] font-medium text-foreground">Other shortcuts</p>
          <p className="text-muted-foreground mt-1 mb-2 text-[11px] leading-snug">
            These stay the same regardless of the option above.
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-2.5">
            <ShortcutRow
              label="Toggle redlines"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("L")}</Kbd>}
            />
            <ShortcutRow
              label="Copy all comments"
              keys={<Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>}
            />
            <ShortcutRow
              label="Clear all comments"
              keys={<Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>}
            />
            <ShortcutRow
              label="Cycle theme"
              keys={<Kbd className="text-[10px]">{modAltKey("T")}</Kbd>}
            />
          </div>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-muted-foreground text-[11px]">
            Threads in this document:{" "}
            <span className="font-mono text-foreground">{comments.length}</span>
          </p>
        </div>

        <div className="flex justify-end border-t border-border/60 px-4 py-3">
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

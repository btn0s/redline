import type { ReactNode } from "react"
import { useTheme } from "@/components/theme-provider.tsx"
import { useShortcutScheme } from "@/contexts/shortcut-scheme-context"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addCommentShortcutDisplay,
  modAltKey,
  modShiftAltKey,
  modShiftKeyCompact,
} from "@/lib/format-shortcut"
import type { ShortcutScheme } from "@/lib/shortcut-scheme"
import { cn } from "@/lib/utils"
import {
  dialogBody,
  dialogHeaderBlock,
  dialogSection,
  dialogSectionLast,
  dialogSectionTitle,
  dialogScrollableSurface,
  dialogShortcutList,
} from "@/components/review-dialog-styles"

interface ReviewSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ShortcutRow({ label, keys }: { label: string; keys: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0">
      <span className={cn(dialogBody, "shrink-0 pt-px")}>{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-1">{keys}</div>
    </div>
  )
}

export function ReviewSettingsDialog({
  open,
  onOpenChange,
}: ReviewSettingsDialogProps) {
  const { scheme, setScheme } = useShortcutScheme()
  const { theme, setTheme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={dialogScrollableSurface}
        data-prevent-redlines-dismiss=""
      >
        <div className={dialogHeaderBlock}>
          <DialogHeader className="gap-2 text-left">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Appearance, new-comment shortcut, and the rest of the chord list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className={dialogSection}>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="settings-appearance"
                className={cn(dialogSectionTitle, "cursor-default")}
              >
                Appearance
              </Label>
              <Kbd className="text-[10px]">{modAltKey("T")}</Kbd>
            </div>
            <Select
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark")}
            >
              <SelectTrigger
                id="settings-appearance"
                size="sm"
                className="w-full min-w-0 max-w-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={dialogSection}>
          <div className="space-y-2">
            <p className={dialogSectionTitle}>New comment shortcut</p>
            <RadioGroup
              value={scheme}
              onValueChange={(v) => setScheme(v as ShortcutScheme)}
              className="gap-1.5"
            >
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 transition-colors duration-150 ease-out",
                  scheme === "google-docs" && "border-primary/50 bg-muted/40",
                )}
              >
                <RadioGroupItem value="google-docs" className="mt-0" />
                <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-foreground">
                  Google Docs style
                </span>
                <Kbd className="shrink-0 text-[10px]">
                  {addCommentShortcutDisplay("google-docs")}
                </Kbd>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 transition-colors duration-150 ease-out",
                  scheme === "notion" && "border-primary/50 bg-muted/40",
                )}
              >
                <RadioGroupItem value="notion" className="mt-0" />
                <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-foreground">
                  Notion style
                </span>
                <Kbd className="shrink-0 text-[10px]">
                  {addCommentShortcutDisplay("notion")}
                </Kbd>
              </label>
            </RadioGroup>
          </div>
        </div>

        <div className={dialogSectionLast}>
          <div className="space-y-2">
            <h3 className={dialogSectionTitle}>Other shortcuts</h3>
            <div className={dialogShortcutList}>
              <ShortcutRow
                label="Copy all comments"
                keys={<Kbd className="text-[10px]">{modShiftKeyCompact("C")}</Kbd>}
              />
              <ShortcutRow
                label="Clear all comments"
                keys={<Kbd className="text-[10px]">{modShiftAltKey("C")}</Kbd>}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

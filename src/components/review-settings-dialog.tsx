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
  ChordModAltCompact,
  ChordModShiftAlt,
  ChordModShiftCompact,
} from "@/components/shortcut-glyph-chords"
import type { ShortcutScheme } from "@/lib/shortcut-scheme"
import { cn } from "@/lib/utils"
import {
  dialogBody,
  dialogHeaderBlock,
  dialogSection,
  dialogSectionLast,
  dialogSectionTitle,
  dialogScrollableSurface,
  dialogSettingsInputTrigger,
  dialogShortcutList,
  dialogShortcutRow,
} from "@/components/review-dialog-styles"

interface ReviewSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ShortcutRow({ label, keys }: { label: string; keys: ReactNode }) {
  return (
    <div className={dialogShortcutRow}>
      <span className={cn(dialogBody, "min-w-0 flex-1")}>{label}</span>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">{keys}</div>
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
          <DialogHeader className="text-left">
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
              <Kbd>
                <ChordModAltCompact letter="T" />
              </Kbd>
            </div>
            <Select
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark")}
            >
              <SelectTrigger
                id="settings-appearance"
                size="sm"
                className={cn(
                  "w-full min-w-0 max-w-none",
                  dialogSettingsInputTrigger,
                )}
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
            <div className={dialogShortcutList}>
              <RadioGroup
                value={scheme}
                onValueChange={(v) => setScheme(v as ShortcutScheme)}
                className="grid w-full gap-0"
              >
                <label
                  className={cn(
                    dialogShortcutRow,
                    "cursor-pointer rounded-sm transition-colors duration-150 ease-out",
                    scheme === "google-docs" &&
                      "bg-muted/30 dark:bg-muted/40",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <RadioGroupItem
                      value="google-docs"
                      id="settings-scheme-google-docs"
                      className="mt-0 shrink-0"
                    />
                    <span className="min-w-0 truncate text-xs font-medium leading-snug text-foreground">
                      Google Docs style
                    </span>
                  </div>
                  <Kbd className="shrink-0">
                    <ChordModAltCompact letter="M" />
                  </Kbd>
                </label>
                <label
                  className={cn(
                    dialogShortcutRow,
                    "cursor-pointer rounded-sm transition-colors duration-150 ease-out",
                    scheme === "notion" && "bg-muted/30 dark:bg-muted/40",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <RadioGroupItem
                      value="notion"
                      id="settings-scheme-notion"
                      className="mt-0 shrink-0"
                    />
                    <span className="min-w-0 truncate text-xs font-medium leading-snug text-foreground">
                      Notion style
                    </span>
                  </div>
                  <Kbd className="shrink-0">
                    <ChordModShiftCompact letter="M" />
                  </Kbd>
                </label>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className={dialogSectionLast}>
          <div className="space-y-2">
            <h3 className={dialogSectionTitle}>Other shortcuts</h3>
            <div className={dialogShortcutList}>
              <ShortcutRow
                label="Copy all comments"
                keys={
                  <Kbd>
                    <ChordModShiftCompact letter="C" />
                  </Kbd>
                }
              />
              <ShortcutRow
                label="Clear all comments"
                keys={
                  <Kbd>
                    <ChordModShiftAlt letter="C" />
                  </Kbd>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

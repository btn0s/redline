import type { ReactNode } from "react"
import { useTheme } from "@/components/theme-provider.tsx"
import { useShortcutScheme } from "@/contexts/shortcut-scheme-context"
import { useEditorSettings } from "@/contexts/editor-settings-context"
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
import { Switch } from "@/components/ui/switch"
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
  const { theme, setTheme } = useTheme()
  const { spellcheckEnabled, setSpellcheckEnabled } = useEditorSettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90svh,36rem)] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"
        data-prevent-redlines-dismiss=""
      >
        <div className="border-b border-border/60 p-4 pb-3">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Appearance, new-comment shortcut, and the rest of the chord list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="settings-spellcheck"
              className="text-[11px] font-medium text-foreground"
            >
              Browser spellcheck
            </Label>
            <Switch
              id="settings-spellcheck"
              checked={spellcheckEnabled}
              onCheckedChange={setSpellcheckEnabled}
              aria-label="Toggle browser spellcheck"
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label
              htmlFor="settings-appearance"
              className="text-[11px] font-medium text-foreground"
            >
              Appearance
            </Label>
            <Kbd className="text-[10px]">{modAltKey("T")}</Kbd>
          </div>
          <Select
            value={theme}
            onValueChange={(v) =>
              setTheme(v as "system" | "light" | "dark")
            }
          >
            <SelectTrigger
              id="settings-appearance"
              size="sm"
              className="w-full min-w-0 max-w-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="px-4 py-3 pb-4">
          <Label className="text-[11px] font-medium text-foreground">
            New comment shortcut
          </Label>
          <RadioGroup
            value={scheme}
            onValueChange={(v) => setScheme(v as ShortcutScheme)}
            className="mt-2 gap-2"
          >
            <label
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 p-2.5 transition-colors",
                scheme === "google-docs" && "border-primary/50 bg-muted/40",
              )}
            >
              <RadioGroupItem value="google-docs" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium">Google Docs style</span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                  <Kbd className="text-[10px]">
                    {addCommentShortcutDisplay("google-docs")}
                  </Kbd>
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
                <span className="block text-[12px] font-medium">Notion style</span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                  <Kbd className="text-[10px]">
                    {addCommentShortcutDisplay("notion")}
                  </Kbd>
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>

        <div className="px-4 py-3 pb-4">
          <p className="text-[11px] font-medium text-foreground">Other shortcuts</p>
          <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 px-2.5">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

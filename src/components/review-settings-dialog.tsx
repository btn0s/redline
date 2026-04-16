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
              Appearance, new-comment shortcut, and the rest of the chord list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
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

        <div className="border-t border-border/60 px-4 py-3 pb-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label
              htmlFor="settings-comment-shortcut"
              className="text-[11px] font-medium text-foreground"
            >
              New comment shortcut
            </Label>
            <Kbd className="text-[10px]">{addCommentShortcutDisplay(scheme)}</Kbd>
          </div>
          <Select
            value={scheme}
            onValueChange={(v) => setScheme(v as ShortcutScheme)}
          >
            <SelectTrigger
              id="settings-comment-shortcut"
              size="sm"
              className="w-full min-w-0 max-w-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google-docs">Google Docs / Word</SelectItem>
              <SelectItem value="notion">Notion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border/60 px-4 py-3 pb-4">
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

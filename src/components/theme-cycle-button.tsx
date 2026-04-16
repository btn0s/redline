import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider.tsx"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { modAltKey } from "@/lib/format-shortcut"

export function ThemeCycleButton() {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon
  const label =
    theme === "system"
      ? "System theme"
      : theme === "light"
        ? "Light theme"
        : "Dark theme"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={cycleTheme}
            aria-label={`Cycle color theme. Current: ${label}.`}
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
          >
            <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>
        }
      />
      <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
        <span>Cycle theme</span>
        <Kbd className="text-[10px]">{modAltKey("T")}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider.tsx"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChordModAltCompact } from "@/components/shortcut-glyph-chords"

export function ThemeCycleButton() {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === "light" ? Sun : Moon
  const label = theme === "light" ? "Light theme" : "Dark theme"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={cycleTheme}
            aria-label={`Toggle color theme. Current: ${label}.`}
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full active:scale-[0.97]"
          >
            <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>
        }
      />
      <TooltipContent side="top" sideOffset={8} className="flex flex-wrap items-center gap-1.5">
        <span>Toggle theme</span>
        <Kbd>
          <ChordModAltCompact letter="T" />
        </Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

import { useCallback } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider.tsx"
import { Button } from "@/components/ui/button"

export function ThemeCycleButton() {
  const { theme, setTheme } = useTheme()

  const cycle = useCallback(() => {
    if (theme === "system") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("system")
    }
  }, [theme, setTheme])

  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon
  const label =
    theme === "system"
      ? "System theme"
      : theme === "light"
        ? "Light theme"
        : "Dark theme"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      title={`${label} — click to cycle`}
      aria-label={`Cycle color theme. Current: ${label}.`}
      className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
    >
      <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
    </Button>
  )
}

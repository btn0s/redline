import { cn } from "@/lib/utils"

function Kbd({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"kbd"> & { variant?: "default" | "skeuo" }) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        variant === "skeuo" &&
          "desk-skeuo-pill pointer-events-none inline-flex w-fit min-h-0 min-w-0 items-center justify-center font-sans select-none",
        variant === "default" &&
          "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-xs bg-muted px-1 font-sans text-[0.625rem] font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

type SeparatorVariant = "default" | "engraved"

function Separator({
  className,
  orientation = "horizontal",
  variant = "default",
  ...props
}: SeparatorPrimitive.Props & { variant?: SeparatorVariant }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        variant === "default" && "bg-border",
        variant === "engraved" && "desk-sep",
        className,
      )}
      {...props}
    />
  )
}

export { Separator }

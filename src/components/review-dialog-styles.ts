/** Shared dialog rhythm + type scale (help + settings). */
/** Only caps at ~viewport height so normal content fits without scrolling; scrolls if content is unusually tall. */
export const dialogScrollableSurface =
  "max-h-[90svh] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"

export const dialogHeaderBlock = "px-5 pt-4 pb-3"
const dialogSectionBase = "border-t border-border/50 px-5 py-3"
export const dialogSection = dialogSectionBase
export const dialogSectionLast = dialogSectionBase
export const dialogSectionTitle = "text-xs font-medium text-foreground"
export const dialogBody = "text-xs leading-relaxed text-muted-foreground"
export const dialogLead =
  "text-xs font-medium leading-snug text-foreground"
export const dialogMonoLink =
  "font-mono text-xs text-muted-foreground underline-offset-2 transition-colors duration-150 ease-out hover:text-foreground hover:underline"
export const dialogShortcutList =
  "rounded-lg border border-border/50 bg-muted/20 px-2.5"

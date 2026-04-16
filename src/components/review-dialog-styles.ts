/** Shared dialog rhythm + type scale (help + settings). */
/** Only caps at ~viewport height so normal content fits without scrolling; scrolls if content is unusually tall. */
export const dialogScrollableSurface =
  "max-h-[90svh] w-full max-w-md gap-0 overflow-y-auto p-0 sm:max-w-md"

export const dialogHeaderBlock = "px-5 pt-4 pb-3"
const dialogSectionBase = "desk-sep-top px-5 py-3"
export const dialogSection = dialogSectionBase
export const dialogSectionLast = dialogSectionBase
export const dialogSectionTitle = "text-xs font-medium text-foreground"
export const dialogBody = "text-xs leading-relaxed text-muted-foreground"
export const dialogLead =
  "text-xs font-medium leading-snug text-foreground"
export const dialogMonoLink =
  "font-mono text-xs text-muted-foreground underline-offset-2 transition-colors duration-150 ease-out hover:text-foreground hover:underline"
/** Inset surfaces inside `.desk-panel` dialogs: `muted/10` on desk reads as identical;
 * use paper (`card`) in light mode and a stronger muted wash in dark. */
/** No outer padding: borderless wash only; rows (`dialogShortcutRow`) supply spacing. */
export const dialogShortcutList =
  "rounded-lg border-0 bg-muted/15 p-0 shadow-none ring-0 dark:bg-muted/30"

/** Single row inside `dialogShortcutList` (help + settings shortcut tables). */
export const dialogShortcutRow =
  "flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0"

/** Settings dialog — select trigger: match inset surfaces (not `bg-input/20` on desk). */
export const dialogSettingsInputTrigger =
  "border-border/70 bg-card shadow-none ring-1 ring-foreground/[0.06] hover:bg-muted/12 focus-visible:bg-card dark:border-border dark:bg-muted/45 dark:ring-foreground/10 dark:hover:bg-muted/55 dark:focus-visible:bg-muted/45"

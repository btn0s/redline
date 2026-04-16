/**
 * Warm light pool cast across the viewport. Fades in with dark mode so
 * flipping themes reads as "lights off + one lamp on".
 */
export function DeskLamp() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-0 transition-opacity duration-200 ease-out dark:opacity-100"
      style={{
        background:
          "radial-gradient(80vw 70vh at 6% 0%, var(--lamp-core, transparent), var(--lamp-mid, transparent) 28%, var(--lamp-falloff, transparent) 55%, transparent 75%)",
      }}
    />
  )
}

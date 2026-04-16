/**
 * Wide, soft warm light in dark mode — reads as one lamp in a dim room, not a
 * tight spotlight on a black void.
 */
export function DeskLamp() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-0 transition-opacity duration-300 ease-out dark:opacity-100"
      style={{
        background: `
          radial-gradient(
            ellipse 165% 145% at 4% -18%,
            var(--lamp-ambient, transparent),
            transparent 52%
          ),
          radial-gradient(
            ellipse 130% 115% at 14% 6%,
            var(--lamp-core, transparent),
            var(--lamp-mid, transparent) 38%,
            var(--lamp-falloff, transparent) 62%,
            var(--lamp-edge, transparent) 88%,
            transparent 100%
          )
        `,
      }}
    />
  )
}

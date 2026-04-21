import type { CSSProperties } from "react"

const STICKY_ROTATIONS = [-1.2, 0.9, -0.5, 1.4, -0.8, 0.6, -1.6, 1.1]

export const STICKY_COLOR_CLASSES = [
  "",
  "sticky-note--pink",
  "",
  "sticky-note--blue",
  "",
  "sticky-note--green",
  "",
] as const

function stringHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function stickyRotationStyle(seed: string): CSSProperties {
  const idx = stringHash(seed) % STICKY_ROTATIONS.length
  return { ["--sticky-rotate" as string]: `${STICKY_ROTATIONS[idx]}deg` }
}

export function stickyColorClass(seed: string): string {
  const idx = stringHash(seed) % STICKY_COLOR_CLASSES.length
  return STICKY_COLOR_CLASSES[idx] ?? ""
}

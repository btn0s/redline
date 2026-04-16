import { createHash } from "node:crypto"
import { basename, relative, resolve, sep } from "node:path"
import type { Stats } from "node:fs"

export function computeRevFromStats(st: Pick<Stats, "mtimeMs" | "size">): string {
  return createHash("sha256")
    .update(`${st.mtimeMs}:${st.size}`)
    .digest("hex")
    .slice(0, 16)
}

export function getDisplayPath(filePath: string): string {
  const filename = basename(filePath)
  return (
    relative(process.cwd(), filePath).split(/[/\\]/).join("/") || filename
  )
}

export type ParsePutBodyResult =
  | { ok: true; content: string }
  | { ok: false; error: string }

/** Safe JSON body for PUT /api/file — rejects malformed JSON and wrong shape. */
export function parseFilePutBody(body: string): ParsePutBodyResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return { ok: false, error: "Invalid JSON" }
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("content" in parsed) ||
    typeof (parsed as { content: unknown }).content !== "string"
  ) {
    return { ok: false, error: "Expected { content: string }" }
  }
  return { ok: true, content: (parsed as { content: string }).content }
}

/**
 * Returns true if `candidatePath` is exactly `rootDir` or a file/dir inside it
 * (after resolving). Prevents path traversal via `..` or absolute paths.
 */
export function isResolvedPathInsideDirectory(
  rootDir: string,
  candidatePath: string,
): boolean {
  const root = resolve(rootDir)
  const candidate = resolve(candidatePath)
  if (candidate === root) return true
  const prefix = root.endsWith(sep) ? root : root + sep
  return candidate.startsWith(prefix)
}

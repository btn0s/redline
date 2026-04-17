import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"
import type { Comment } from "@/types/comment"

/** Min vertical gap between stacked cards (layout is axis-aligned; extra room for tilt + action bars). */
const GAP_PX = 18
const CONTAINER_BOTTOM_PAD_PX = 8

function markSelector(commentId: string): string {
  return `mark.comment-mark[data-comment-id="${CSS.escape(commentId)}"]`
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduce(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduce
}

export interface UseCommentSidebarLayoutArgs {
  editor: TiptapEditor | null
  orderedComments: Comment[]
  showNewComment: boolean
  activeCommentId: string | null
  containerRef: RefObject<HTMLElement | null>
  itemRefs: MutableRefObject<Record<string, HTMLDivElement | null>>
  draftWrapperRef: RefObject<HTMLDivElement | null>
}

export interface CommentSidebarLayoutResult {
  positions: Record<string, number>
  draftTop: number | null
  containerMinHeightPx: number
  /** True once we've measured real positions (editor DOM + marks present, or nothing to show). Card container must stay hidden until then. */
  measured: boolean
  /** True a frame after `measured` flips; only then is it safe to transition position changes. */
  transitionsArmed: boolean
  reduceMotion: boolean
}

type LayoutItem =
  | { kind: "comment"; id: string }
  | { kind: "draft" }

function buildMergedItems(
  orderedComments: Comment[],
  showNewComment: boolean,
  editor: TiptapEditor | null,
): LayoutItem[] {
  if (!showNewComment || !editor) {
    return orderedComments.map((c) => ({ kind: "comment" as const, id: c.id }))
  }

  const draftPos = Math.min(
    editor.state.selection.from,
    editor.state.selection.to,
  )

  const merged: LayoutItem[] = []
  let draftInserted = false
  for (const c of orderedComments) {
    if (!draftInserted && c.anchorFrom >= draftPos) {
      merged.push({ kind: "draft" })
      draftInserted = true
    }
    merged.push({ kind: "comment", id: c.id })
  }
  if (!draftInserted) {
    merged.push({ kind: "draft" })
  }
  return merged
}

export function useCommentSidebarLayout({
  editor,
  orderedComments,
  showNewComment,
  activeCommentId,
  containerRef,
  itemRefs,
  draftWrapperRef,
}: UseCommentSidebarLayoutArgs): CommentSidebarLayoutResult {
  const reduceMotion = usePrefersReducedMotion()
  const [measured, setMeasured] = useState(false)
  const [transitionsArmed, setTransitionsArmed] = useState(false)

  const [positions, setPositions] = useState<Record<string, number>>({})
  const [draftTop, setDraftTop] = useState<number | null>(null)
  const [containerMinHeightPx, setContainerMinHeightPx] = useState(0)

  /** Returns true if this pass produced positions we're willing to show.
      Requires the editor DOM to be attached (otherwise every anchor falls back
      to y=0 and the cards would paint stacked at the top). If there's nothing
      to place, the layout is trivially real. */
  const computeLayout = useCallback((): boolean => {
    const container = containerRef.current
    if (!container) {
      setPositions({})
      setDraftTop(null)
      setContainerMinHeightPx(0)
      return false
    }

    const editorDom = editor?.view.dom
    const editorH =
      editorDom instanceof HTMLElement ? editorDom.offsetHeight : 0

    const containerRect = container.getBoundingClientRect()

    const anchorYForComment = (id: string): number | null => {
      if (!editorDom) return null
      const el = editorDom.querySelector(markSelector(id))
      if (!(el instanceof HTMLElement)) return null
      const r = el.getBoundingClientRect()
      return r.top - containerRect.top
    }

    const anchorYForDraft = (): number | null => {
      if (!editor) return null
      const { from } = editor.state.selection
      try {
        const coords = editor.view.coordsAtPos(from)
        return coords.top - containerRect.top
      } catch {
        return null
      }
    }

    const merged = buildMergedItems(orderedComments, showNewComment, editor)

    const nextPositions: Record<string, number> = {}
    let draftY: number | null = null
    let stackBottom = 0

    for (const item of merged) {
      if (item.kind === "draft") {
        const desired = anchorYForDraft() ?? stackBottom
        const top = Math.max(desired, stackBottom)
        draftY = top
        const draftEl = draftWrapperRef.current
        const h = draftEl?.offsetHeight ?? 0
        stackBottom = top + h + GAP_PX
        continue
      }

      const { id } = item
      const anchorY = anchorYForComment(id)
      const desired = anchorY ?? stackBottom
      const top = Math.max(desired, stackBottom)
      nextPositions[id] = top
      const wrap = itemRefs.current[id]
      const h = wrap?.offsetHeight ?? 0
      stackBottom = top + h + GAP_PX
    }

    setPositions(nextPositions)
    setDraftTop(showNewComment && editor ? draftY : null)

    const contentBottom =
      Math.max(stackBottom - GAP_PX, 0) + CONTAINER_BOTTOM_PAD_PX
    setContainerMinHeightPx(Math.max(editorH, contentBottom))

    if (merged.length === 0) return true
    return editor != null
  }, [
    containerRef,
    draftWrapperRef,
    editor,
    itemRefs,
    orderedComments,
    showNewComment,
  ])

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- layout sync from refs/DOM before paint
    const real = computeLayout()
    if (real && !measured) setMeasured(true)
  }, [computeLayout, activeCommentId, measured])

  // Arm transitions one frame after we first have real positions so the reveal
  // itself is instant, but later movements animate.
  useEffect(() => {
    if (!measured || transitionsArmed) return
    const id = requestAnimationFrame(() => setTransitionsArmed(true))
    return () => cancelAnimationFrame(id)
  }, [measured, transitionsArmed])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        computeLayout()
      }, 100)
    }
    editor.on("update", onUpdate)
    return () => {
      editor.off("update", onUpdate)
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [editor, computeLayout])

  useEffect(() => {
    const onResize = () => computeLayout()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [computeLayout])

  useEffect(() => {
    const editorDom = editor?.view.dom
    const ro = new ResizeObserver(() => computeLayout())
    if (editorDom instanceof HTMLElement) ro.observe(editorDom)
    const c = containerRef.current
    if (c) ro.observe(c)
    return () => ro.disconnect()
  }, [editor, containerRef, computeLayout])

  const commentIdsKey = orderedComments.map((c) => c.id).join("\0")
  useEffect(() => {
    const ro = new ResizeObserver(() => computeLayout())
    for (const c of orderedComments) {
      const el = itemRefs.current[c.id]
      if (el) ro.observe(el)
    }
    const draftEl = draftWrapperRef.current
    if (draftEl) ro.observe(draftEl)
    return () => ro.disconnect()
  }, [
    commentIdsKey,
    showNewComment,
    activeCommentId,
    computeLayout,
    orderedComments,
    itemRefs,
    draftWrapperRef,
  ])

  return {
    positions,
    draftTop,
    containerMinHeightPx,
    measured,
    transitionsArmed,
    reduceMotion,
  }
}

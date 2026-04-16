import { Mark, mergeAttributes, type Editor } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { forEachCommentMark } from "@/lib/editor-utils"

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, string>
}

export const commentHoverPluginKey = new PluginKey<string | null>(
  "commentHoverHighlight",
)

/** Editor + sidebar “linked” highlight: active thread keeps highlight until hover targets another id. */
export function resolveCommentLinkHighlightId(
  activeCommentId: string | null,
  hoveredCommentId: string | null,
): string | null {
  if (activeCommentId) {
    if (
      hoveredCommentId === null ||
      hoveredCommentId === activeCommentId
    ) {
      return activeCommentId
    }
    return hoveredCommentId
  }
  return hoveredCommentId
}

export function setHoveredComment(
  editor: Editor,
  commentId: string | null,
): void {
  const tr = editor.state.tr.setMeta(commentHoverPluginKey, commentId)
  editor.view.dispatch(tr)
}

const PILL_CLICK_ZONE_PX = 8

function isInSquiggleBand(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const range = document.createRange()
  range.selectNodeContents(el)
  const rects = range.getClientRects()
  for (const r of rects) {
    if (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.bottom - PILL_CLICK_ZONE_PX &&
      clientY <= r.bottom + PILL_CLICK_ZONE_PX
    ) {
      return true
    }
  }
  return false
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentMark: {
      setCommentMark: (commentId: string) => ReturnType
      unsetCommentMark: () => ReturnType
    }
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: "commentMark",

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) => ({
          "data-comment-id": attrs.commentId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "mark[data-comment-id]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "comment-mark",
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId }),
      unsetCommentMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: "",
          close: "",
        },
      },
      onPillClick: null as ((commentId: string) => void) | null,
    }
  },

  addProseMirrorPlugins() {
    const storage = (this.editor.storage as unknown as Record<string, unknown>).commentMark as {
      onPillClick: ((commentId: string) => void) | null
    }

    return [
      new Plugin<string | null>({
        key: commentHoverPluginKey,

        state: {
          init: () => null,
          apply(tr, prev) {
            const meta = tr.getMeta(commentHoverPluginKey) as
              | string
              | null
              | undefined
            if (meta !== undefined) return meta
            return prev
          },
        },

        props: {
          decorations(state) {
            const hoveredId = commentHoverPluginKey.getState(state)
            if (!hoveredId) return DecorationSet.empty

            const decos: Decoration[] = []
            forEachCommentMark(state.doc, (commentId, from, to) => {
              if (commentId === hoveredId) {
                decos.push(
                  Decoration.inline(from, to, {
                    class: "comment-mark--hot",
                  }),
                )
              }
            })
            return DecorationSet.create(state.doc, decos)
          },

          handleClick(view, _pos, event) {
            let el = event.target as HTMLElement | null
            const dom = view.dom
            while (el && el !== dom) {
              if (el.matches("mark.comment-mark[data-comment-id]")) {
                if (
                  !isInSquiggleBand(
                    el,
                    event.clientX,
                    event.clientY,
                  )
                ) {
                  return false
                }
                const commentId = el.getAttribute("data-comment-id")
                if (!commentId) return false
                if (
                  commentId.startsWith("draft-") &&
                  !view.state.doc.type.schema.marks.commentMark
                ) {
                  return false
                }
                if (storage.onPillClick) {
                  storage.onPillClick(commentId)
                  return true
                }
                return false
              }
              el = el.parentElement
            }
            return false
          },

          handleDOMEvents: {
            mousemove(view, event) {
              const mouseEvent = event as MouseEvent
              let el = mouseEvent.target as HTMLElement | null
              const dom = view.dom
              while (el && el !== dom) {
                if (el.matches("mark.comment-mark[data-comment-id]")) {
                  const hit = isInSquiggleBand(
                    el,
                    mouseEvent.clientX,
                    mouseEvent.clientY,
                  )
                  dom.style.cursor = hit ? "pointer" : ""
                  return false
                }
                el = el.parentElement
              }
              if (dom.style.cursor === "pointer") dom.style.cursor = ""
              return false
            },
          },
        },
      }),
      new Plugin({
        appendTransaction(_transactions, oldState, newState) {
          if (oldState.doc.eq(newState.doc)) return null
          const existing = new Set<string>()
          forEachCommentMark(newState.doc, (id) => existing.add(id))
          const prev = new Set<string>()
          forEachCommentMark(oldState.doc, (id) => prev.add(id))
          if (
            existing.size === prev.size &&
            [...existing].every((id) => prev.has(id))
          ) {
            return null
          }
          const hoveredId = commentHoverPluginKey.getState(newState)
          if (!hoveredId || !existing.has(hoveredId)) return null
          return newState.tr.setMeta(commentHoverPluginKey, hoveredId)
        },
      }),
    ]
  },
})

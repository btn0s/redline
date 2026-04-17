import type { Editor } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { forEachCommentMark } from "@/lib/editor-utils"

export type DraftPseudoSelectionMeta = {
  draftId?: string | null
  focused?: boolean
}

type DraftPseudoSelectionState = {
  draftId: string | null
  editorFocused: boolean
}

export const draftPseudoSelectionKey = new PluginKey<DraftPseudoSelectionState>(
  "draftPseudoSelection",
)

export function setDraftSelectionHighlight(
  editor: Editor,
  draftId: string | null,
): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(draftPseudoSelectionKey, { draftId }),
  )
}

export function createDraftPseudoSelectionPlugin() {
  return new Plugin<DraftPseudoSelectionState>({
    key: draftPseudoSelectionKey,

    state: {
      init: (): DraftPseudoSelectionState => ({
        draftId: null,
        editorFocused: true,
      }),

      apply(tr, prev): DraftPseudoSelectionState {
        const meta = tr.getMeta(draftPseudoSelectionKey) as
          | DraftPseudoSelectionMeta
          | undefined
        if (meta === undefined) return prev
        return {
          draftId:
            meta.draftId !== undefined ? meta.draftId : prev.draftId,
          editorFocused:
            meta.focused !== undefined ? meta.focused : prev.editorFocused,
        }
      },
    },

    props: {
      decorations(state) {
        const plug = draftPseudoSelectionKey.getState(state)
        if (!plug?.draftId || plug.editorFocused) {
          return DecorationSet.empty
        }
        const decos: Decoration[] = []
        forEachCommentMark(state.doc, (commentId, from, to) => {
          if (commentId === plug.draftId) {
            decos.push(
              Decoration.inline(from, to, {
                class: "comment-draft-pseudo-selection",
              }),
            )
          }
        })
        return DecorationSet.create(state.doc, decos)
      },
    },

    view(editorView) {
      const sync = () => {
        const focused = editorView.hasFocus()
        const prev = draftPseudoSelectionKey.getState(editorView.state)
        if (!prev || prev.editorFocused === focused) return
        editorView.dispatch(
          editorView.state.tr.setMeta(draftPseudoSelectionKey, {
            focused,
          }),
        )
      }
      editorView.dom.addEventListener("focus", sync, true)
      editorView.dom.addEventListener("blur", sync, true)
      queueMicrotask(sync)
      return {
        destroy() {
          editorView.dom.removeEventListener("focus", sync, true)
          editorView.dom.removeEventListener("blur", sync, true)
        },
      }
    },
  })
}

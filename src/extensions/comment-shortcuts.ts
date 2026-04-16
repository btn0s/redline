import { Extension } from "@tiptap/core"
import {
  REVIEW_MD_ADD_COMMENT,
  REVIEW_MD_COPY_COMMENTS,
  REVIEW_MD_TOGGLE_COMMENTS_PANEL,
} from "@/lib/review-md-events"

export const CommentShortcuts = Extension.create({
  name: "commentShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-m": () => {
        const { from, to } = this.editor.state.selection
        if (from === to) return false
        window.dispatchEvent(new CustomEvent(REVIEW_MD_ADD_COMMENT))
        return true
      },
      "Mod-Shift-c": () => {
        window.dispatchEvent(new CustomEvent(REVIEW_MD_COPY_COMMENTS))
        return true
      },
      "Mod-Shift-l": () => {
        window.dispatchEvent(
          new CustomEvent(REVIEW_MD_TOGGLE_COMMENTS_PANEL),
        )
        return true
      },
    }
  },
})

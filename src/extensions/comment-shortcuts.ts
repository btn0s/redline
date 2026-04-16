import { Extension } from "@tiptap/core"
import {
  REVIEW_MD_ADD_COMMENT,
  REVIEW_MD_COPY_COMMENTS,
  REVIEW_MD_TOGGLE_COMMENTS_PANEL,
} from "@/lib/review-md-events"
import { shortcutSchemeRef } from "@/lib/shortcut-scheme-ref"

export const CommentShortcuts = Extension.create({
  name: "commentShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-m": () => {
        if (shortcutSchemeRef.current !== "google-docs") return false
        const { from, to } = this.editor.state.selection
        if (from === to) return false
        window.dispatchEvent(new CustomEvent(REVIEW_MD_ADD_COMMENT))
        return true
      },
      "Mod-Shift-m": () => {
        if (shortcutSchemeRef.current !== "notion") return false
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

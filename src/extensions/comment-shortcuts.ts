import { Extension } from "@tiptap/core"

export const CommentShortcuts = Extension.create({
  name: "commentShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-m": () => {
        const { from, to } = this.editor.state.selection
        if (from !== to) {
          window.dispatchEvent(new CustomEvent("review-md:add-comment"))
        }
        return true
      },
      "Mod-Shift-c": () => {
        window.dispatchEvent(new CustomEvent("review-md:copy-comments"))
        return true
      },
      "Mod-Shift-l": () => {
        window.dispatchEvent(
          new CustomEvent("review-md:toggle-comments-panel"),
        )
        return true
      },
    }
  },
})

import { Mark, mergeAttributes } from "@tiptap/core"

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, string>
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
        class:
          "cursor-pointer rounded-sm bg-blue-600 px-0.5 font-medium text-white transition-colors hover:bg-blue-500",
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
        /** Omit comment marks from saved markdown so the file stays clean. */
        serialize: {
          open: "",
          close: "",
        },
      },
    }
  },
})

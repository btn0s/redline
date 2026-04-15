import { useEffect, useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"
import { Extension } from "@tiptap/core"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { CommentMark } from "@/extensions/comment-mark"
import { Button } from "@/components/ui/button"

const CommentShortcuts = Extension.create({
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
    }
  },
})

interface EditorProps {
  content: string
  onUpdate: (markdown: string) => void
  onEditorReady: (editor: TiptapEditor) => void
  /** Hide the selection bubble while the comment form or another overlay is open. */
  bubbleMenuSuppressed?: boolean
  onAddCommentFromBubble?: () => void
}

export function Editor({
  content,
  onUpdate,
  onEditorReady,
  bubbleMenuSuppressed = false,
  onAddCommentFromBubble,
}: EditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      CommentMark,
      CommentShortcuts,
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      const md = (
        editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      ).markdown.getMarkdown()
      onUpdate(md)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[min(100vh,32rem)] py-12 focus:outline-none dark:prose-invert",
      },
    },
  })

  useEffect(() => {
    if (editor) onEditorReady(editor)
  }, [editor, onEditorReady])

  return (
    <>
      <EditorContent editor={editor} />
      {editor && onAddCommentFromBubble ? (
        <BubbleMenu
          editor={editor}
          appendTo={() => document.body}
          shouldShow={({ state }) => {
            if (bubbleMenuSuppressed) return false
            const { from, to } = state.selection
            if (from === to) return false
            const resolved = state.doc.resolve(from)
            if (resolved.marks().some((m) => m.type.name === "commentMark")) {
              return false
            }
            return true
          }}
          options={{
            placement: "bottom",
            offset: 8,
            flip: true,
            shift: { padding: 8 },
          }}
          className="z-[100] flex"
        >
          <Button
            type="button"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault()
              onAddCommentFromBubble()
            }}
          >
            Comment
          </Button>
        </BubbleMenu>
      ) : null}
    </>
  )
}

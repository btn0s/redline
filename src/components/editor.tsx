import { useEffect, useMemo, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"
import { Extension } from "@tiptap/core"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { MessageSquarePlus } from "lucide-react"
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
  /** Increment to replace the document from `content` (e.g. reload from disk). */
  contentReloadNonce?: number
  /** Hide the selection bubble while the comment form or another overlay is open. */
  bubbleMenuSuppressed?: boolean
  onAddCommentFromBubble?: () => void
}

export function Editor({
  content,
  onUpdate,
  onEditorReady,
  contentReloadNonce = 0,
  bubbleMenuSuppressed = false,
  onAddCommentFromBubble,
}: EditorProps) {
  const lastMarkdownRef = useRef(content)
  const lastReloadNonceRef = useRef(0)

  useEffect(() => {
    lastMarkdownRef.current = content
  }, [content])

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
      if (md === lastMarkdownRef.current) {
        return
      }
      lastMarkdownRef.current = md
      onUpdate(md)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-slate max-w-none min-h-[min(100vh,32rem)] py-12 outline-none focus-visible:outline-none dark:prose-invert",
      },
    },
  })

  useEffect(() => {
    if (editor) onEditorReady(editor)
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editor) return
    if (contentReloadNonce === 0) {
      lastReloadNonceRef.current = 0
      return
    }
    if (contentReloadNonce === lastReloadNonceRef.current) return
    lastReloadNonceRef.current = contentReloadNonce
    editor.commands.setContent(content, { emitUpdate: false })
    lastMarkdownRef.current = content
  }, [contentReloadNonce, content, editor])

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
          className="z-[100] pointer-events-auto flex items-center gap-0 rounded-full border border-border bg-card/95 p-0.5 text-muted-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md supports-backdrop-filter:bg-card/85 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none dark:border-white/10 dark:bg-[#141414]/95 dark:text-zinc-400 dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] dark:ring-black/20 dark:supports-backdrop-filter:bg-[#141414]/85"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Add comment"
            aria-label="Add comment"
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            onMouseDown={(e) => {
              e.preventDefault()
              onAddCommentFromBubble()
            }}
          >
            <MessageSquarePlus className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>
        </BubbleMenu>
      ) : null}
    </>
  )
}

import { useEffect, useMemo, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { MessageSquarePlus } from "lucide-react"
import { CommentMark } from "@/extensions/comment-mark"
import { CommentShortcuts } from "@/extensions/comment-shortcuts"
import { Button } from "@/components/ui/button"

interface EditorProps {
  content: string
  onUpdate: (markdown: string) => void
  onEditorReady: (editor: TiptapEditor) => void
  /** Increment to replace the document from `content` (e.g. reload from disk). */
  contentReloadNonce?: number
  /** Hide the selection bubble while the comment form or another overlay is open. */
  bubbleMenuSuppressed?: boolean
  onAddComment?: () => void
}

export function Editor({
  content,
  onUpdate,
  onEditorReady,
  contentReloadNonce = 0,
  bubbleMenuSuppressed = false,
  onAddComment,
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
      const markdownStorage = (
        editor.storage as { markdown?: { getMarkdown?: () => string } }
      ).markdown
      if (typeof markdownStorage?.getMarkdown !== "function") {
        if (import.meta.env.DEV) {
          console.warn(
            "tiptap-markdown getMarkdown() not found on editor.storage.markdown",
          )
        }
        return
      }
      const md = markdownStorage.getMarkdown()
      if (md === undefined) {
        if (import.meta.env.DEV) {
          console.warn("tiptap-markdown getMarkdown() returned undefined")
        }
        return
      }
      if (md === lastMarkdownRef.current) {
        return
      }
      lastMarkdownRef.current = md
      onUpdate(md)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[min(100vh,32rem)] py-12 outline-none focus-visible:outline-none",
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
      {editor && onAddComment ? (
        <BubbleMenu
          editor={editor}
          appendTo={() => document.body}
          shouldShow={({ state }) => {
            if (bubbleMenuSuppressed) return false
            const { from, to } = state.selection
            if (from === to) return false
            let hasCommentMark = false
            state.doc.nodesBetween(from, to, (node) => {
              if (node.marks.some((m) => m.type.name === "commentMark")) {
                hasCommentMark = true
                return false
              }
            })
            return !hasCommentMark
          }}
          options={{
            placement: "bottom",
            offset: 8,
            flip: true,
            shift: { padding: 8 },
          }}
          className="bubble-menu z-[100] pointer-events-auto flex items-center gap-0 rounded-full border border-border bg-card/95 p-0.5 text-muted-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md supports-backdrop-filter:bg-card/85 dark:border-white/10 dark:bg-[#141414]/95 dark:text-zinc-400 dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] dark:ring-black/20 dark:supports-backdrop-filter:bg-[#141414]/85"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Add comment"
            aria-label="Add comment"
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-full text-muted-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] dark:text-zinc-400"
            onMouseDown={(e) => {
              e.preventDefault()
              onAddComment()
            }}
          >
            <MessageSquarePlus className="size-3.5 stroke-[1.5]" aria-hidden />
          </Button>
        </BubbleMenu>
      ) : null}
    </>
  )
}

import { useEffect, useMemo, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"
import type { Editor as TiptapEditor } from "@tiptap/core"
import { CommentMark } from "@/extensions/comment-mark"
import { CommentShortcuts } from "@/extensions/comment-shortcuts"

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
  const [spent, setSpent] = useState(false)

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
          "prose prose-sm max-w-none min-h-[min(100vh,32rem)] outline-none focus-visible:outline-none",
        spellcheck: "false",
      },
    },
  })

  useEffect(() => {
    if (editor) onEditorReady(editor)
  }, [editor, onEditorReady])

  // Only a fresh expanded selection revives the pill. Skipping collapsed
  // selections here is what prevents the pill flashing back inside tippy's
  // fade-out when the draft closes.
  useEffect(() => {
    if (!editor) return
    const onSelection = () => {
      const { from, to } = editor.state.selection
      if (from !== to) setSpent(false)
    }
    editor.on("selectionUpdate", onSelection)
    return () => {
      editor.off("selectionUpdate", onSelection)
    }
  }, [editor])

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
            offset: 0,
            flip: true,
            shift: { padding: 8 },
          }}
          className="bubble-menu pointer-events-auto z-[100]"
        >
          <button
            type="button"
            title="Leave a sticky"
            aria-label="Leave a sticky"
            className="inline-flex h-6 shrink-0 items-center gap-1.5 border px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] leading-none shadow-[0_1px_0_rgba(255,255,255,0.45)_inset,0_2px_4px_rgba(0,0,0,0.12),0_8px_18px_-6px_rgba(0,0,0,0.22)] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
            style={{
              backgroundColor: "var(--sticky)",
              color: "var(--sticky-foreground)",
              borderColor: "var(--sticky-edge)",
              borderRadius: "2px 4px 3px 5px",
              transform: "rotate(-1.5deg)",
              visibility: spent ? "hidden" : undefined,
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              if (spent) return
              setSpent(true)
              onAddComment()
            }}
          >
            <span aria-hidden>[+]</span>
            <span>Sticky</span>
          </button>
        </BubbleMenu>
      ) : null}
    </>
  )
}

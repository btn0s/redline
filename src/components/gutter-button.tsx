import { useEffect, useState } from "react"
import type { Editor } from "@tiptap/core"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GutterButtonProps {
  editor: Editor
  onComment: (blockPos: { from: number; to: number }) => void
}

export function GutterButton({ editor, onComment }: GutterButtonProps) {
  const [position, setPosition] = useState<{
    top: number
    left: number
    from: number
    to: number
  } | null>(null)

  useEffect(() => {
    const editorDom = editor.view.dom

    const handleMouseMove = (e: MouseEvent) => {
      const editorRect = editorDom.getBoundingClientRect()
      if (e.clientX > editorRect.left + 40) {
        setPosition(null)
        return
      }

      const pos = editor.view.posAtCoords({
        left: editorRect.left + 20,
        top: e.clientY,
      })
      if (!pos) {
        setPosition(null)
        return
      }

      const resolved = editor.state.doc.resolve(pos.pos)
      const blockNode = resolved.node(1)
      if (!blockNode) {
        setPosition(null)
        return
      }

      const blockStart = resolved.start(1)
      const blockEnd = resolved.end(1)

      const dom = editor.view.nodeDOM(resolved.before(1)) as HTMLElement | null
      if (!dom) {
        setPosition(null)
        return
      }

      const domRect = dom.getBoundingClientRect()
      setPosition({
        top: domRect.top,
        left: editorRect.left - 40,
        from: blockStart,
        to: blockEnd,
      })
    }

    const handleMouseLeave = () => setPosition(null)

    const container = editorDom.parentElement
    container?.addEventListener("mousemove", handleMouseMove)
    container?.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container?.removeEventListener("mousemove", handleMouseMove)
      container?.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [editor])

  if (!position) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground fixed z-[90] h-8 w-8"
      style={{ top: position.top, left: position.left }}
      aria-label="Comment on block"
      onMouseDown={(e) => {
        e.preventDefault()
        editor
          .chain()
          .focus()
          .setTextSelection({ from: position.from, to: position.to })
          .run()
        onComment({ from: position.from, to: position.to })
      }}
    >
      <MessageSquare className="size-4" aria-hidden />
    </Button>
  )
}

import type { Editor } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"

export function forEachCommentMark(
  doc: PMNode,
  callback: (commentId: string, from: number, to: number) => void,
): void {
  doc.descendants((node, pos) => {
    for (const mark of node.marks) {
      if (
        mark.type.name === "commentMark" &&
        typeof mark.attrs.commentId === "string"
      ) {
        callback(mark.attrs.commentId, pos, pos + node.nodeSize)
      }
    }
  })
}

export function removeCommentMarkFromEditor(
  editor: Editor,
  commentId: string,
): void {
  let markFrom: number | null = null
  let markTo: number | null = null

  forEachCommentMark(editor.state.doc, (id, from, to) => {
    if (id !== commentId) return
    if (markFrom === null) markFrom = from
    markTo = to
  })

  if (markFrom !== null && markTo !== null) {
    const markType = editor.state.schema.marks.commentMark
    if (markType) {
      const tr = editor.state.tr.removeMark(markFrom, markTo, markType)
      editor.view.dispatch(tr)
    }
  }
}

export function removeAllCommentMarksFromEditor(editor: Editor): void {
  const markType = editor.state.schema.marks.commentMark
  if (!markType) return
  const { doc } = editor.state
  const tr = editor.state.tr.removeMark(0, doc.content.size, markType)
  if (tr.docChanged || tr.steps.length > 0) {
    editor.view.dispatch(tr)
  }
}

import { JSX, useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentLess, indentMore } from "@codemirror/commands";
import { basicSetup } from "codemirror";

export function MarkdownEditView({
  blockId,
  initialMarkdown,
  initialOffset,
  onBlur,
  onBlockIndent,
  onBlockSplit,
}: {
  blockId: string | undefined;
  initialMarkdown: string;
  initialOffset?: number | null;
  onBlur: (currentMarkdown: string) => void;
  onBlockIndent?: (currentMarkdown: string, shift: boolean) => void;
  onBlockSplit?: (textBefore: string, textAfter: string) => void;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) {
      return;
    }

    let isDestroying = false;
    let explicitMultiLine = false;
    const startOffset = clampOffset(initialOffset, initialMarkdown);
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: initialMarkdown,
        selection: { anchor: startOffset },
        extensions: [
          basicSetup,
          editModeTheme,
          keymap.of([
            {
              key: "Ctrl-Enter",
              run: (view) => {
                const currentMarkdown = view.state.doc.toString();
                explicitMultiLine = toggleExplicitMultiLine(
                  currentMarkdown,
                  explicitMultiLine,
                );
                return true;
              },
            },
            {
              key: "Enter",
              run: (view) => {
                const currentMarkdown = view.state.doc.toString();
                if (isMultiLineMode(currentMarkdown, explicitMultiLine)) {
                  return false;
                }
                const offset = view.state.selection.main.from;
                onBlockSplit?.(
                  currentMarkdown.slice(0, offset),
                  currentMarkdown.slice(offset),
                );
                return true;
              },
            },
            {
              key: "Tab",
              run: (view) => {
                const currentMarkdown = view.state.doc.toString();
                if (isMultiLineMode(currentMarkdown, explicitMultiLine)) {
                  return indentMore(view);
                }
                onBlockIndent?.(currentMarkdown, false);
                return true;
              },
              shift: (view) => {
                const currentMarkdown = view.state.doc.toString();
                if (isMultiLineMode(currentMarkdown, explicitMultiLine)) {
                  return indentLess(view);
                }
                onBlockIndent?.(currentMarkdown, true);
                return true;
              },
            },
            {
              key: "Alt-Tab",
              run: (view) => {
                const currentMarkdown = view.state.doc.toString();
                onBlockIndent?.(currentMarkdown, false);
                return true;
              },
              shift: (view) => {
                const currentMarkdown = view.state.doc.toString();
                onBlockIndent?.(currentMarkdown, true);
                return true;
              },
            },
          ]),
          EditorView.domEventHandlers({
            blur: (_event, view) => {
              if (isDestroying) {
                return;
              }
              onBlur(view.state.doc.toString());
            },
          }),
        ],
      }),
    });

    view.focus();

    return () => {
      isDestroying = true;
      view.destroy();
    };
  }, [
    blockId,
    initialMarkdown,
    initialOffset,
    onBlur,
    onBlockIndent,
    onBlockSplit,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[1.5em] rounded-sm border-primary/40 bg-primary/5 px-1"
      data-block-id={blockId}
    />
  );
}

export function isMultiLineMode(
  currentMarkdown: string,
  explicitMultiLine: boolean,
): boolean {
  return explicitMultiLine || currentMarkdown.includes("\n");
}

export function toggleExplicitMultiLine(
  currentMarkdown: string,
  explicitMultiLine: boolean,
): boolean {
  if (!explicitMultiLine) {
    return true;
  }
  return currentMarkdown.includes("\n");
}

function clampOffset(
  offset: number | null | undefined,
  markdown: string,
): number {
  if (offset === null || offset === undefined) {
    return 0;
  }
  return Math.max(0, Math.min(offset, markdown.length));
}

const editModeTheme = EditorView.theme({
  "&": {
    width: "100%",
    background: "transparent",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "inherit",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-content": {
    caretColor: "currentColor",
    padding: "0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "currentColor",
  },
  ".cm-line": {
    padding: "0",
  },
  "&.cm-focused": {
    outline: "none",
  },
});

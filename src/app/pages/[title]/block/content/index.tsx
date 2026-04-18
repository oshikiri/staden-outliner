import {
  JSX,
  useRef,
  useEffect,
  useState,
  MouseEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
} from "react";

import {
  applyContentMarkdown,
  Block as BlockEntity,
  getContentMarkdown,
} from "@/app/lib/markdown/block";
import { Token } from "../../token";
import { postPage } from "../api";
import { useStore } from "../../state";

import { Suggestion } from "./suggestion";
import { ContentKeyboardEventHandler } from "./keyboardeventhandler";
import {
  getOffset,
  getNearestCursorOffset,
  extractTextContent,
  setCursor,
} from "./dom";

// eslint-disable-next-line max-lines-per-function
export function Content({
  block,
  editable,
}: {
  block: BlockEntity;
  editable: boolean;
}): JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);

  const page = useStore((state) => state.page) || new BlockEntity([], 0, []);
  const setPage = useStore((state) => state.setPage);
  const editingBlockId = useStore((state) => state.editingBlockId);
  const setEditingBlockId = useStore((state) => state.setEditingBlockId);
  const offset = useStore((state) => state.offset);
  const setOffset = useStore((state) => state.setOffset);

  const [suggestionQuery, setSuggestionQuery] = useState<string | undefined>(
    undefined,
  );
  const [contentMarkdown, setContentMarkdown] = useState<string>(
    getContentMarkdown(block),
  );

  const isEditing = editingBlockId === block.id;
  useEffect(() => {
    if (isEditing) {
      // render mode -> edit mode
      setContentMarkdown(getContentMarkdown(block));
      contentRef.current?.focus();

      if (contentRef.current) {
        const cursorOffset = getOffset(contentRef.current, offset || 0);
        const currentNode = contentRef?.current;
        if (currentNode) {
          setCursor(currentNode, cursorOffset);
        }
      }
    }
  }, [isEditing, offset]);

  const onClickContent: MouseEventHandler = async (event) => {
    if (!editable) {
      return;
    }

    setEditingBlockId?.(block.id || null);
    const startOffset = getNearestCursorOffset(event.clientX, event.clientY);
    setOffset(startOffset);
    event.stopPropagation();
  };

  const onBlurContent: FocusEventHandler = (event) => {
    if (editingBlockId !== block.id) {
      return;
    }

    event.stopPropagation();

    window.requestAnimationFrame(() => {
      const currentElement = contentRef.current;
      if (!currentElement) {
        return;
      }

      if (document.activeElement === currentElement) {
        return;
      }

      if (isEditableElementForBlock(document.activeElement, block.id || "")) {
        return;
      }

      if (useStore.getState().editingBlockId !== block.id) {
        return;
      }

      const contentMarkdown = extractTextContent(currentElement);
      console.log("onBlurContent", { contentMarkdown });

      const blockId = block.id || "";
      const blockOnPage = page.getBlockById(blockId);
      if (!blockOnPage) {
        console.error(`Block not found: id=${blockId}`);
        return;
      }

      applyContentMarkdown(blockOnPage, contentMarkdown);
      postPage(page).then((page) => setPage(page));
      setEditingBlockId?.(null);
    });
  };

  const onKeyDown: KeyboardEventHandler = new ContentKeyboardEventHandler(
    page,
    block,
    contentRef,
    setEditingBlockId,
    setOffset,
    setPage,
    setSuggestionQuery,
    setContentMarkdown,
  ).getOnKeydown();

  return (
    <div>
      <div
        key={`content-${block.id}-${isEditing ? "editing" : "rendered"}`}
        ref={contentRef}
        className="w-full min-h-[1em] inline-block whitespace-pre-wrap break-all px-1"
        data-block-id={block.id}
        contentEditable={isEditing || undefined}
        suppressContentEditableWarning={isEditing || undefined}
        onClick={onClickContent}
        onBlur={onBlurContent}
        onKeyDown={onKeyDown}
      >
        {isEditing ? (
          <>{contentMarkdown || ""}</>
        ) : (
          <RenderedContent block={block} />
        )}
      </div>
      <Suggestion
        suggestionQuery={suggestionQuery}
        setSuggestionQuery={setSuggestionQuery}
        contentMarkdown={contentRef.current?.textContent || ""}
        setup={() => {
          setEditingBlockId(null);
          // @owner Debug log left in UI code; remove or guard.
          console.log(offset);
        }}
        teardown={(contentMarkdown: string) => {
          // @owner Avoid logging content payloads; may leak sensitive data.
          console.log("teardown", contentMarkdown);
          setContentMarkdown(contentMarkdown);
          // @owner Remove debug logs or guard under a debug flag.
          console.log("teardown", contentMarkdown.length);
          setOffset(contentMarkdown.length - 1 || 0);
          setEditingBlockId(block.id || null);
        }}
      />
    </div>
  );
}

function RenderedContent({ block }: { block: BlockEntity }): JSX.Element {
  return (
    <>
      {block.content.map((t, i) => (
        <Token key={`content-${block.id}/${i}`} token={t} />
      ))}
    </>
  );
}

function isEditableElementForBlock(
  element: Element | null,
  blockId: string,
): boolean {
  if (!(element instanceof HTMLDivElement)) {
    return false;
  }

  return (
    element.getAttribute("contenteditable") === "true" &&
    element.dataset.blockId === blockId
  );
}

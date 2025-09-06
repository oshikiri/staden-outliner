import { KeyboardEventHandler, KeyboardEvent, RefObject } from "react";

import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { postPage } from "../../api";
import { extractTextContent } from "../dom";
import * as caret from "./caret";
import * as dom from "./dom";
import * as range from "./range";
import { removeSubstring } from "./string";

export class ContentKeyboardEventHandler {
  constructor(
    private page: BlockEntity,
    private block: BlockEntity,
    private contentRef: RefObject<HTMLDivElement | null>,
    private setEditingBlockId: ((id: string | null) => void) | undefined,
    private setOffset: ((offset: number | null) => void) | undefined,
    private setPage: (page: BlockEntity | null) => void,
    private setSuggestionQuery: (query: string) => void = () => {},
    private setContentMarkdown: (markdown: string) => void = () => {},
  ) {}

  /**
   * Maps keyboard events to block editing actions.
   */
  getOnKeydown(): KeyboardEventHandler {
    return (event) => {
      if (event.key === "Enter") {
        this.enter(event);
      } else if (event.key == "Tab") {
        this.tab(event);
      } else if (event.key === "ArrowDown") {
        this.arrowDown(event);
      } else if (event.key === "ArrowUp") {
        this.arrowUp(event);
      } else if (event.ctrlKey && event.key === "a") {
        this.moveToLineStart(event);
      } else if (event.ctrlKey && event.key === "e") {
        this.moveToLineEnd(event);
      } else if (event.ctrlKey && event.key === "k") {
        this.removeRight(event);
      } else if (event.ctrlKey && event.key === "[") {
        this.turnOnSuggestion(event);
      } else if (event.ctrlKey && event.key === "v") {
        this.paste(event);
      }
    };
  }

  enter(event: KeyboardEvent) {
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const { textBefore, textAfter } = dom.extractTextsAroundCursor();

    this.setEditingBlockId?.(null);
    this.setOffset?.(null);
    // RV: Remove verbose console logs in production; consider a debug flag or logger with levels.
    console.log("Enter", {
      block: this.block,
      textBefore,
      textAfter,
      offset: [range.startOffset, range.endOffset],
    });
    const [pageUpdated, blockAfter] = updateMarkdownByEnter(
      this.page,
      this.block,
      textBefore,
      textAfter,
    );
    postPage(pageUpdated).then((pageUpdated) => {
      this.setPage(pageUpdated);
      this.setEditingBlockId?.(blockAfter?.id || null);
      this.setOffset?.(null);
    });
  }

  tab(event: KeyboardEvent) {
    event.preventDefault();
    const currentTextContent = extractTextContent(this.contentRef.current);
    this.block.contentMarkdown = currentTextContent;
    updatePageByIndent(this.page, this.block.id, event.shiftKey);
    postPage(this.page).then((pageUpdated) => {
      this.setPage(pageUpdated);
      this.setEditingBlockId?.(this.block.id || null);
      this.setOffset?.(null);
    });
  }

  arrowDown(event: KeyboardEvent) {
    if (
      this.contentRef.current?.hasChildNodes() &&
      !caret.isAtLastLine(window.getSelection())
    ) {
      return;
    }
    event.preventDefault();
    const nextBlock = this.block.getNext();
    this.setEditingBlockId?.(nextBlock?.id || null);
    const { startOffset } = dom.getTextsAroundCursor();
    this.setOffset?.(startOffset);
  }

  arrowUp(event: KeyboardEvent) {
    if (
      this.contentRef.current?.hasChildNodes() &&
      !caret.isAtFirstLine(window.getSelection())
    ) {
      return;
    }
    event.preventDefault();
    const previousBlock = this.block.getPrevious();
    this.setEditingBlockId?.(previousBlock?.id || null);
    const { startOffset } = dom.getTextsAroundCursor();
    this.setOffset?.(startOffset);
  }

  /**
   * NOTE: This method does not handle cases where the text is visually wrapped into multiple lines.
   * It only considers actual newline characters.
   */
  moveToLineStart(event: KeyboardEvent) {
    event.preventDefault();

    const caretPosition = getCursorPositionInBlock(window.getSelection()!);
    const newlineBeforeCaret = caretPosition?.newlines?.findLast((newline) => {
      return newline.index! < caretPosition.anchorOffset;
    });
    if (newlineBeforeCaret) {
      this.setOffset?.(newlineBeforeCaret.index! + 1);
    } else {
      this.setOffset?.(0);
    }
  }

  /**
   * See also `moveToLineStart`.
   */
  moveToLineEnd(event: KeyboardEvent) {
    event.preventDefault();

    const caretPosition = getCursorPositionInBlock(window.getSelection()!);
    const newlineAfterCaret = caretPosition?.newlines?.find((newline) => {
      return newline.index! >= caretPosition.anchorOffset;
    });
    if (newlineAfterCaret) {
      this.setOffset?.(newlineAfterCaret.index!);
    } else {
      this.setOffset?.(this.contentRef.current?.textContent?.length || 0);
    }
  }

  /**
   * Remove all text to the right of the cursor.
   * It also handle the multiline case.
   */
  removeRight(event: KeyboardEvent) {
    event.preventDefault();

    const contentMarkdownBefore = this.contentRef.current?.textContent || "";
    const { startOffset } = dom.getTextsAroundCursor();
    const rangeset = range.getNewlineRangeset(contentMarkdownBefore);
    const cursorRange = rangeset.getRange(startOffset);
    if (!cursorRange) {
      console.error("Cursor range not found");
      return;
    }

    const newTextContent = removeSubstring(
      contentMarkdownBefore,
      startOffset,
      cursorRange.r - 1,
    );
    if (!this.contentRef.current) {
      return;
    }
    this.contentRef.current.textContent = newTextContent;
    this.block.contentMarkdown = newTextContent;

    this.setOffset?.(startOffset);
  }

  turnOnSuggestion(event: KeyboardEvent) {
    event.preventDefault();
    this.setSuggestionQuery("");
  }

  paste(event: KeyboardEvent) {
    event.preventDefault();
    navigator.clipboard.read().then((clipboardItems) => {
      const clipboardItem = clipboardItems[0];
      this.handlePasteItem(clipboardItem).catch((error) =>
        console.error("Failed to paste item:", error),
      );
    });
  }

  private async handlePasteItem(clipboardItem: ClipboardItem) {
    const types = clipboardItem.types;
    // RV: Consider limiting clipboard logging; may expose sensitive clipboard content in logs.
    console.log("Pasting item with types:", types);
    if (types.includes("text/plain")) {
      const blob = await clipboardItem.getType("text/plain");
      const text = await blob.text();
      // RV: Avoid logging pasted text; sensitive data may be exposed.
      console.log("Pasted text:", text);

      const { beforeCursor, afterCursor } = dom.getTextsAroundCursor();
      this.setContentMarkdown(beforeCursor + text + afterCursor);
      this.setOffset?.(beforeCursor.length);
    } else if (types.includes("image/png")) {
      const blob = await clipboardItem.getType("image/png");
      console.log("Pasted image blob:", blob);
    } else {
      console.warn("Clipboard item type not supported:", types);
    }
  }
}

function getCursorPositionInBlock(selection: Selection):
  | {
      newlines: RegExpMatchArray[];
      anchorOffset: number;
    }
  | undefined {
  const text: Text = selection.anchorNode as Text;
  const wholeText = text.wholeText || "";
  const anchorOffset = selection.anchorOffset;
  const newlines = Array.from(wholeText.matchAll(/\n/g));
  return { newlines, anchorOffset };
}

function updateMarkdownByEnter(
  page: BlockEntity,
  block: BlockEntity | undefined,
  textBefore: string,
  textAfter?: string,
): [BlockEntity, BlockEntity | undefined] {
  if (!page || !block) {
    return [page, undefined];
  }
  const blockBefore = page.getBlockById(block.id || "");
  if (!blockBefore) {
    return [page, undefined];
  }
  blockBefore.contentMarkdown = textBefore;

  const blockAfter = new BlockEntity([], blockBefore.depth, []).withId(
    self.crypto.randomUUID(),
  );
  blockAfter.pageId = blockBefore.pageId;
  blockAfter.contentMarkdown = textAfter;

  const [parent, idx] = blockBefore.getParentAndIdx();
  if (!parent) {
    console.error("Block has no parent");
    return [page, undefined];
  }

  if (blockBefore.hasChildren()) {
    blockBefore.children.splice(0, 0, blockAfter);
  } else {
    parent.children.splice(idx + 1, 0, blockAfter);
  }

  return [page, blockAfter];
}

async function updatePageByIndent(
  page: BlockEntity,
  blockId: string | undefined,
  shift: boolean,
) {
  const block = page.getBlockById(blockId || "");
  if (!block) {
    console.error("Block not found");
    return;
  }
  if (shift) {
    block.decreaseLevel();
  } else {
    block.increaseLevel();
  }
  return;
}

import * as range from "./range";

export function isAtFirstLine(selection: Selection | null): boolean {
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const pos = getCursorPositionInBlock(selection);
  const isAtTop = pos?.newlines?.every?.((newline) => {
    return pos.anchorOffset <= newline.index;
  });

  return isAtTop === undefined ? true : isAtTop;
}

export function isAtLastLine(selection: Selection | null): boolean {
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const content = selection.anchorNode?.textContent || "";
  if (content.length === 0) {
    return false;
  }

  const lastlineRange = range.getNewlineRangeset(content).getLastRange();
  if (!lastlineRange) {
    return false;
  }
  const caretOffset = selection.anchorOffset;
  return lastlineRange.contains(caretOffset);
}

function getCursorPositionInBlock(selection: Selection | null) {
  if (!selection) return {};

  const text: Text = selection.anchorNode as Text;
  const wholeText = text.wholeText || "";
  const anchorOffset = selection.anchorOffset;
  const newlines = Array.from(wholeText.matchAll(/\n/g));
  return { newlines, wholeText, anchorOffset };
}

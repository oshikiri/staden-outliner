export function extractTextContent(content: HTMLDivElement | null): string {
  if (!content) {
    return "";
  }

  let text = "";
  for (const child of content.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      if (element.tagName === "BR") {
        text += "\n";
      } else if (element.tagName === "SPAN") {
        text += element.textContent;
      }
    }
  }
  return text;
}

export function getNearestCursorOffset(x: number, y: number): number {
  // NOTE: `document.caretPositionFromPoint` is not supported in Safari and
  // Chromium may expose only `caretRangeFromPoint`.
  // https://developer.mozilla.org/ja/docs/Web/API/Document/caretPositionFromPoint
  const documentWithCaretFallback = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  const caretPosition = documentWithCaretFallback.caretPositionFromPoint?.(
    x,
    y,
  );
  if (caretPosition) {
    return caretPosition.offset;
  }

  const caretRange = documentWithCaretFallback.caretRangeFromPoint?.(x, y);
  return caretRange?.startOffset || 0;
}

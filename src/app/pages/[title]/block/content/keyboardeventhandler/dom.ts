export function getTextsAroundCursor(): {
  beforeCursor: string;
  afterCursor: string;
  startOffset: number;
} {
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  const text = range?.startContainer.textContent;
  if (!text) {
    return { beforeCursor: "", afterCursor: "", startOffset: 0 };
  }
  const beforeCursor = text.substring(0, range.startOffset);
  const afterCursor = text.substring(range.endOffset);
  return { beforeCursor, afterCursor, startOffset: range.startOffset };
}

export function extractTextsAroundCursor() {
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);

  let beforeCursor = true;
  const caretElement = range?.startContainer.parentElement;
  const parentElement = caretElement?.parentElement;
  if (!range || !parentElement) {
    return { textBefore: "", textAfter: "" };
  }

  let textBefore = "";
  let textAfter = "";

  for (const child of parentElement.children) {
    if (child === caretElement) {
      const offset = range.startOffset;
      if (!child.textContent) continue;
      textBefore += child.textContent.substring(0, offset);
      textAfter += child.textContent.substring(offset);
      beforeCursor = false;
    } else {
      if (beforeCursor) {
        textBefore += extractTextContent(child);
      } else {
        const childText = extractTextContent(child);
        if (textAfter === "" && childText == "\n") continue;
        textAfter += extractTextContent(child);
      }
    }
  }
  return { textBefore, textAfter };
}

function extractTextContent(content: Element): string {
  if (content.nodeType === Node.TEXT_NODE) {
    return content.textContent || "";
  } else if (content.nodeType === Node.ELEMENT_NODE) {
    const element = content as HTMLElement;
    if (element.tagName === "BR") {
      return "\n";
    } else if (element.tagName === "SPAN") {
      return element.textContent || "";
    }
  }
  return "";
}

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
  const caretPosition = document.caretPositionFromPoint(x, y);
  return caretPosition?.offset || 0;
}

export function setCursor(currentNode: ChildNode, offset: number | null): void {
  if (offset === null) {
    offset = 0;
  }

  const node = getTextNodeInside(currentNode);
  if (!node) {
    console.error("No text node found");
    return;
  }

  const nodeTextLength = node.textContent?.length || 0;
  if (offset > nodeTextLength) {
    offset = nodeTextLength;
  }

  // RV: Remove console.log before production; consider using a debugger instead.
  console.log("setCursor", node);

  const range = document.createRange();
  range.setStart(node, offset);
  range.setEnd(node, offset);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getTextNodeInside(node: ChildNode): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }
  const firstChild = node.firstChild;
  if (firstChild) {
    return getTextNodeInside(firstChild);
  }
  const textNode = document.createTextNode("");
  node.appendChild(textNode);
  return textNode;
}

export function getOffset(node: HTMLElement, startOffset: number): number {
  const nextInnerText = node.innerText || "";
  if (startOffset >= nextInnerText.length) {
    return nextInnerText.length;
  }
  return startOffset;
}

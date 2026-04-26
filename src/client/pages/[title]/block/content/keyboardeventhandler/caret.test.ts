import { afterEach, describe, expect, test } from "bun:test";

import { isAtFirstLine, isAtLastLine } from "./caret";

describe("keyboardeventhandler/caret", () => {
  const originalWindow = globalThis.window;
  const originalNode = globalThis.Node;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
    } else {
      globalThis.window = originalWindow;
    }

    if (originalNode === undefined) {
      delete (globalThis as { Node?: typeof Node }).Node;
    } else {
      globalThis.Node = originalNode;
    }
  });

  test("returns false when selection is missing", () => {
    installSelectionMocks(null);

    expect(isAtFirstLine(window.getSelection())).toBe(false);
    expect(isAtLastLine(window.getSelection())).toBe(false);
  });

  test("detects first and last line boundaries from newline positions", () => {
    installSelectionMocks({
      rangeCount: 1,
      anchorNode: createTextNode("hello\nworld"),
      anchorOffset: 3,
      getRangeAt() {
        return {} as Range;
      },
    } as unknown as Selection);

    expect(isAtFirstLine(window.getSelection())).toBe(true);
    expect(isAtLastLine(window.getSelection())).toBe(false);

    installSelectionMocks({
      rangeCount: 1,
      anchorNode: createTextNode("hello\nworld"),
      anchorOffset: 8,
      getRangeAt() {
        return {} as Range;
      },
    } as unknown as Selection);

    expect(isAtFirstLine(window.getSelection())).toBe(false);
    expect(isAtLastLine(window.getSelection())).toBe(true);
  });
});

function installSelectionMocks(selection: Selection | null): void {
  Object.defineProperty(globalThis, "Node", {
    configurable: true,
    value: {
      TEXT_NODE: 3,
      ELEMENT_NODE: 1,
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      getSelection: () => selection,
    },
  });
}

function createTextNode(textContent: string): {
  nodeType: number;
  textContent: string;
  wholeText: string;
} {
  return {
    nodeType: 3,
    textContent,
    wholeText: textContent,
  };
}

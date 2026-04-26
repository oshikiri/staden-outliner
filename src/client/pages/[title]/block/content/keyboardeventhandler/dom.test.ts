import { afterEach, describe, expect, test } from "bun:test";

import { extractTextsAroundCursor, getTextsAroundCursor } from "./dom";

describe("keyboardeventhandler/dom", () => {
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

  test("returns empty text when selection is missing", () => {
    installSelectionMocks(null);

    expect(getTextsAroundCursor()).toEqual({
      beforeCursor: "",
      afterCursor: "",
      startOffset: 0,
    });
    expect(extractTextsAroundCursor()).toEqual({
      textBefore: "",
      textAfter: "",
    });
  });

  test("returns empty text when selection has no ranges", () => {
    installSelectionMocks({
      rangeCount: 0,
      getRangeAt() {
        throw new Error("should not be called");
      },
    } as unknown as Selection);

    expect(getTextsAroundCursor()).toEqual({
      beforeCursor: "",
      afterCursor: "",
      startOffset: 0,
    });
    expect(extractTextsAroundCursor()).toEqual({
      textBefore: "",
      textAfter: "",
    });
  });

  test("reads cursor-adjacent text from a valid selection", () => {
    const root = {
      children: [] as unknown[],
    };
    const currentText = createTextNode("world");
    const current = createElementNode("world", currentText);
    const after = createElementNode("!");
    const before = createElementNode("hello");

    root.children = [before, current, after];
    before.parentElement = root;
    current.parentElement = root;
    after.parentElement = root;
    currentText.parentElement = current;

    installSelectionMocks({
      rangeCount: 1,
      getRangeAt() {
        return {
          startContainer: currentText,
          startOffset: 3,
          endOffset: 3,
        } as unknown as Range;
      },
    } as unknown as Selection);

    expect(getTextsAroundCursor()).toEqual({
      beforeCursor: "wor",
      afterCursor: "ld",
      startOffset: 3,
    });
    expect(extractTextsAroundCursor()).toEqual({
      textBefore: "hello" + "wor",
      textAfter: "ld" + "!",
    });
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
  parentElement?: { parentElement?: unknown; children?: unknown[] };
} {
  return {
    nodeType: 3,
    textContent,
  };
}

function createElementNode(
  textContent: string,
  child?: {
    nodeType: number;
    textContent: string;
    parentElement?: { parentElement?: unknown; children?: unknown[] };
  },
): {
  nodeType: number;
  tagName: string;
  textContent: string;
  childNodes: unknown[];
  parentElement?: { parentElement?: unknown; children?: unknown[] };
  children: unknown[];
} {
  const childNode = child ?? createTextNode(textContent);
  return {
    nodeType: 1,
    tagName: "SPAN",
    textContent,
    childNodes: [childNode],
    children: [childNode],
  };
}

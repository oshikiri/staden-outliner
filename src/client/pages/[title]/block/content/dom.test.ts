import { afterEach, describe, expect, jest, test } from "bun:test";

import { getNearestCursorOffset } from "./dom";

describe("content/dom", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
    jest.restoreAllMocks();
  });

  test("uses caretPositionFromPoint when it is available", () => {
    const caretPositionFromPoint = jest.fn(() => ({ offset: 4 }));
    const caretRangeFromPoint = jest.fn(() => ({ startOffset: 2 }));
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        caretPositionFromPoint,
        caretRangeFromPoint,
      },
    });

    expect(getNearestCursorOffset(10, 20)).toBe(4);
    expect(caretPositionFromPoint).toHaveBeenCalledWith(10, 20);
    expect(caretRangeFromPoint).not.toHaveBeenCalled();
  });

  test("falls back to caretRangeFromPoint when caretPositionFromPoint is unavailable", () => {
    const caretRangeFromPoint = jest.fn(() => ({ startOffset: 2 }));
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        caretPositionFromPoint: undefined,
        caretRangeFromPoint,
      },
    });

    expect(getNearestCursorOffset(10, 20)).toBe(2);
    expect(caretRangeFromPoint).toHaveBeenCalledWith(10, 20);
  });
});

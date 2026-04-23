import { describe, expect, test } from "bun:test";

import { isAbortError, toRequestInit } from "./request";

describe("client/request", () => {
  test("toRequestInit forwards the abort signal", () => {
    const controller = new AbortController();

    expect(toRequestInit({ signal: controller.signal })).toEqual({
      signal: controller.signal,
    });
  });

  test("toRequestInit omits empty options", () => {
    expect(toRequestInit()).toBeUndefined();
  });

  test("isAbortError detects AbortError by name", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("aborted"))).toBe(false);
  });
});

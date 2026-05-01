import { describe, expect, test } from "bun:test";

import { getErrorMessage } from "./error";

describe("getErrorMessage", () => {
  test("returns the error message when it is available", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  test("falls back when the message is empty or the value is not an Error", () => {
    expect(getErrorMessage(new Error("   "), "fallback")).toBe("fallback");
    expect(getErrorMessage("boom", "fallback")).toBe("fallback");
  });
});

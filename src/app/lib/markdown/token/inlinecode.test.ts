import { InlineCode } from "../token";
import { describe, expect, test } from "bun:test";

describe("InlineCode", () => {
  describe("toMarkdown", () => {
    test("appends backquotes to first and last", () => {
      const inlineCode = new InlineCode("inline code content");
      expect(inlineCode.toMarkdown()).toBe("`inline code content`");
    });
  });
});

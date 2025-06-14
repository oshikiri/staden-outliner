import { CodeBlock } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("CodeBlock", () => {
  describe("toMarkdown", () => {
    test("appends backquotes and language", () => {
      const codeBlock = new CodeBlock("code block content", "javascript");
      expect(codeBlock.toMarkdown()).toBe(
        "```javascript\ncode block content```",
      );
    });
  });
});

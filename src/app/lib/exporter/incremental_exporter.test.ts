import { describe, expect, test } from "@jest/globals";

import { Block } from "./../markdown/block";
import { Text } from "./../markdown/token";
import {
  convertToMarkdownRecursive,
  getContentMarkdown,
} from "./incremental_exporter";

describe("convertToMarkdownRecursive", () => {
  test("empty page", () => {
    const block = new Block([], 0, []);
    expect(convertToMarkdownRecursive(block)).toBe("- ");
  });
  test("page with 2 children", () => {
    const block = new Block([new Text("test")], 0, [
      new Block([], 1, [
        new Block([new Text("1-1")], 2, []),
        new Block([new Text("1-2")], 2, []),
      ]),
      new Block([], 1, []),
    ]);
    expect(convertToMarkdownRecursive(block)).toBe(
      "- test\n\t- \n\t\t- 1-1\n\t\t- 1-2\n\t- ",
    );
  });
});

describe("getContentMarkdown", () => {
  describe("when it has no children", () => {
    test("returns an empty string", () => {
      const block = new Block([new Text("test")], 1, []);
      expect(getContentMarkdown(block)).toBe("- test");
    });
  });
  describe("when it has multiline codeblock", () => {
    test("returns the codeblock with newlines", () => {
      const block = new Block([new Text("test\nline2\nline3")], 1, []);
      expect(getContentMarkdown(block)).toBe("- test\nline2\nline3");
    });
  });
});

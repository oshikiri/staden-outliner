import { describe, expect, test } from "@jest/globals";

import { Block } from "./../markdown/block";
import { Text } from "./../markdown/token";
import { convertToMarkdownRecursive } from "./incremental_exporter";

describe("convertToMarkdownRecursive", () => {
  test("empty page", () => {
    const block = new Block([], 0, []);
    expect(convertToMarkdownRecursive(block)).toBe("");
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
      "\n- \n\t- 1-1\n\t- 1-2\n- ",
    );
  });
});

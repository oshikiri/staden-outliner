import { describe, expect, test } from "bun:test";

import { Block } from "@/shared/markdown/block";
import { compareBacklinksByTitle, sortBacklinks } from "@/shared/backlink";

function createBacklink(title: string): Block {
  const block = new Block([], 1, []);
  block.withProperties([["title", title]]);
  return block;
}

describe("backlink", () => {
  test("sorts journal pages before non-journal pages", () => {
    const sorted = sortBacklinks([
      createBacklink("notes"),
      createBacklink("2026-04-23"),
    ]);

    expect(sorted.map((block) => block.getProperty("title"))).toEqual([
      "2026-04-23",
      "notes",
    ]);
  });

  test("sorts titles in descending order within the same group", () => {
    const sorted = sortBacklinks([
      createBacklink("alpha"),
      createBacklink("gamma"),
      createBacklink("beta"),
    ]);

    expect(sorted.map((block) => block.getProperty("title"))).toEqual([
      "gamma",
      "beta",
      "alpha",
    ]);
  });

  test("compareBacklinksByTitle returns 0 for equal titles", () => {
    const block = createBacklink("2026-04-23");

    expect(compareBacklinksByTitle(block, block)).toBe(0);
  });
});

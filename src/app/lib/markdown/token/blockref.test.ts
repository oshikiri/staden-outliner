import { BlockRef } from "../token";
import { describe, expect, test } from "bun:test";

describe("BlockRef", () => {
  describe("toMarkdown", () => {
    test("it returns blockref markdown", () => {
      const blockRef = new BlockRef("block-id");
      expect(blockRef.toMarkdown()).toBe("((block-id))");
    });
  });
});

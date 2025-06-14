import { BlockRef } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("BlockRef", () => {
  describe("toMarkdown", () => {
    test("it returns blockref markdown", () => {
      const blockRef = new BlockRef("block-id");
      expect(blockRef.toMarkdown()).toBe("((block-id))");
    });
  });
});

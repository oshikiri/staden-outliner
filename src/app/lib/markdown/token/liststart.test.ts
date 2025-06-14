import { ListStart } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("ListStart", () => {
  describe("toMarkdown", () => {
    test("returns empty string", () => {
      const liststart = new ListStart(1);
      expect(liststart.toMarkdown()).toBe("");
    });
  });
});

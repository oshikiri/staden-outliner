import { Quote, Text } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Quote", () => {
  describe("toMarkdown", () => {
    test("appends `>`", () => {
      const quote = new Quote([new Text("quote")]);
      expect(quote.toMarkdown()).toBe(">quote");
    });
  });
});

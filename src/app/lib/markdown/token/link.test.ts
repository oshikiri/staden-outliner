import { Link } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Link", () => {
  describe("toMarkdown", () => {
    test("generates link markdown", () => {
      const link = new Link("https://example.com", "example");
      expect(link.toMarkdown()).toBe("[example](https://example.com)");
    });
    test("generates raw link without title", () => {
      const link = new Link("https://example.com", "https://example.com");
      expect(link.toMarkdown()).toBe("https://example.com");
    });
  });
});

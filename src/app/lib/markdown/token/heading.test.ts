import { Heading, Text } from "../token";
import { describe, expect, test } from "bun:test";

describe("Heading", () => {
  describe("toMarkdown", () => {
    test("append #", () => {
      const heading = new Heading(2, [new Text("title")]);
      expect(heading.toMarkdown()).toBe("## title\n");
    });
  });
});

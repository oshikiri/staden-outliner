import { Heading, Text } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Heading", () => {
  describe("toMarkdown", () => {
    test("append #", () => {
      const heading = new Heading(2, [new Text("title")]);
      expect(heading.toMarkdown()).toBe("## title\n");
    });
  });
});

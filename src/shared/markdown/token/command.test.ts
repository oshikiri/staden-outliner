import { Command } from "../token";
import { describe, expect, test } from "bun:test";

describe("Command", () => {
  describe("toMarkdown", () => {
    test("appends brackets", () => {
      const command = new Command("embed", "xxxxxxxxx");
      expect(command.toMarkdown()).toBe("{{embed xxxxxxxxx}}");
    });
  });
});

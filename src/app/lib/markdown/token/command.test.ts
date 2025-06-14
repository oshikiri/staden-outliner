import { Command } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Command", () => {
  describe("toMarkdown", () => {
    test("appends brackets", () => {
      const command = new Command("embed", "xxxxxxxxx");
      expect(command.toMarkdown()).toBe("{{embed xxxxxxxxx}}");
    });
  });
});

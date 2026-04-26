import { CommandQuery } from "../token";
import { describe, expect, test } from "bun:test";

describe("CommandQuery", () => {
  describe("toMarkdown", () => {
    test("returns the staden-query tag", () => {
      const commandQuery = new CommandQuery();
      expect(commandQuery.toMarkdown()).toBe("{{staden-query}}");
    });
  });
});

import { CommandQuery } from "../token";
import { describe, expect, test } from "bun:test";

describe("CommandQuery", () => {
  describe("toMarkdown", () => {
    test("appends brackets", () => {
      const commandQuery = new CommandQuery('(property :status "done")');
      expect(commandQuery.toMarkdown()).toBe(
        '{{query (property :status "done")}}',
      );
    });
  });
});

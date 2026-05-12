import { CommandQuery } from "../token";
import { describe, expect, test } from "bun:test";

describe("CommandQuery", () => {
  describe("toMarkdown", () => {
    test("returns the staden-query tag", () => {
      const commandQuery = new CommandQuery();
      expect(commandQuery.toMarkdown()).toBe("{{staden-query}}");
    });

    test("returns the observable plot tag when enabled", () => {
      const commandQuery = new CommandQuery(
        undefined,
        undefined,
        undefined,
        true,
      );
      expect(commandQuery.toMarkdown()).toBe("{{staden-query observableplot}}");
    });

    test("returns the disabled table tag when enabled", () => {
      const commandQuery = new CommandQuery(
        undefined,
        undefined,
        undefined,
        undefined,
        true,
      );
      expect(commandQuery.toMarkdown()).toBe("{{staden-query disabletable}}");
    });

    test("returns all enabled flags", () => {
      const commandQuery = new CommandQuery(
        undefined,
        undefined,
        undefined,
        true,
        true,
      );
      expect(commandQuery.toMarkdown()).toBe(
        "{{staden-query observableplot disabletable}}",
      );
    });
  });
});

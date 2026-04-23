import { describe, expect, test } from "bun:test";
import { extractTitle, create } from ".";

describe("create", () => {
  test("returns a file object", async () => {
    const file = await create("test", "test-uuid");
    expect(file).toEqual({
      title: "test",
      pageId: "test-uuid",
    });
  });
});

describe("extractTitle", () => {
  test("replaces `_` with `-` for journal pages", () => {
    expect(extractTitle("staden/journals/2023_01_23.md")).toBe("2023-01-23");
  });
});

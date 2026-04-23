import { describe, expect, test } from "bun:test";
import { create } from ".";

describe("create", () => {
  test("returns a file object", async () => {
    const file = await create("test", "test-uuid");
    expect(file).toEqual({
      title: "test",
      pageId: "test-uuid",
    });
  });
});

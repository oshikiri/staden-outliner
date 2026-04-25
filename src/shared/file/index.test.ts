import { describe, expect, test } from "bun:test";
import { createFileRecord } from ".";

describe("createFileRecord", () => {
  test("returns a file object", () => {
    const file = createFileRecord("test", "test-uuid");
    expect(file).toEqual({
      title: "test",
      pageId: "test-uuid",
    });
  });
});

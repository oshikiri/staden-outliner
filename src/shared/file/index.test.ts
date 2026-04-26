import { describe, expect, test } from "bun:test";
import { createPageFileRecord } from ".";

describe("createPageFileRecord", () => {
  test("returns a file object", () => {
    const file = createPageFileRecord("test", "test-uuid");
    expect(file).toEqual({
      title: "test",
      pageId: "test-uuid",
    });
  });
});

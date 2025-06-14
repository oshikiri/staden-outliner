import { describe, expect, test } from "@jest/globals";
import { extractTitle, listAllFilePaths, getLocalFile, create } from ".";

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

describe("listAllFilePaths", () => {
  test("returns descendant file", async () => {
    const paths = await listAllFilePaths("src/app/lib/file/fixtures/");
    expect(paths).toContain("src/app/lib/file/fixtures/d/d-1.md");
  });
});

describe("getLocalFile", () => {
  test("returns the file content", () => {
    const data = getLocalFile("src/app/lib/file/fixtures/a.md");
    expect(data.toString()).toBe("- [[b]]\n");
  });
});

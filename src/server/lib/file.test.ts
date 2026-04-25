import { describe, expect, test } from "bun:test";

import { extractTitle, getLocalFile, listAllFilePaths } from "./file";

describe("listAllFilePaths", () => {
  test("returns descendant file", async () => {
    const paths = await listAllFilePaths("src/shared/file/fixtures/");
    expect(paths).toContain("src/shared/file/fixtures/d/d-1.md");
  });
});

describe("getLocalFile", () => {
  test("returns the file content", async () => {
    const data = await getLocalFile("src/shared/file/fixtures/a.md");
    expect(data).toBe("- [[b]]\n");
  });
});

describe("extractTitle", () => {
  test("replaces `_` with `-` for journal pages", () => {
    expect(extractTitle("staden/journals/2023_01_23.md")).toBe("2023-01-23");
  });
});

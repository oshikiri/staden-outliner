import { describe, expect, test } from "bun:test";

import { getLocalFile, listAllFilePaths } from "./file";

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

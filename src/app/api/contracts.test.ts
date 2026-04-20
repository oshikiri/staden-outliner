import { describe, expect, test } from "bun:test";

import {
  filesRoutePath,
  pageBacklinksRoutePath,
  pageRoutePath,
  pageUpdateMarkdownRoutePath,
} from "./contracts";

describe("api/contracts", () => {
  test("builds encoded route paths", () => {
    expect(pageRoutePath("Daily Notes/2026-04-18")).toBe(
      "/api/pages/Daily%20Notes%2F2026-04-18",
    );
    expect(pageBacklinksRoutePath("Daily Notes")).toBe(
      "/api/pages/Daily%20Notes/backlinks",
    );
    expect(pageUpdateMarkdownRoutePath("Daily Notes")).toBe(
      "/api/pages/Daily%20Notes/update_markdown",
    );
    expect(filesRoutePath("Daily Notes")).toBe("/api/files?prefix=Daily+Notes");
  });
});

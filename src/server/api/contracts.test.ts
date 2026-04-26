import { describe, expect, test } from "bun:test";

import { filesRoutePath } from "./contracts";

describe("api/contracts", () => {
  test("builds encoded file route paths", () => {
    expect(filesRoutePath("Daily Notes")).toBe("/api/files?prefix=Daily+Notes");
  });
});

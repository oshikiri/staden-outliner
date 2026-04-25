import { describe, expect, test } from "bun:test";

import { resolveAllowedOrigin } from "./allowedOrigin";

describe("resolveAllowedOrigin", () => {
  test("uses the default localhost origin when no value is configured", () => {
    expect(resolveAllowedOrigin(undefined)).toBe("http://localhost:3000");
  });

  test("uses the configured port when no origin is configured", () => {
    expect(resolveAllowedOrigin(undefined, 5173)).toBe("http://localhost:5173");
  });

  test("trims and returns the configured origin", () => {
    expect(resolveAllowedOrigin("  https://example.com  ")).toBe(
      "https://example.com",
    );
  });

  test("falls back to the default origin for blank values", () => {
    expect(resolveAllowedOrigin("   ", 8080)).toBe("http://localhost:8080");
  });

  test("falls back to the default port for invalid port values", () => {
    expect(resolveAllowedOrigin(undefined, Number.NaN)).toBe(
      "http://localhost:3000",
    );
  });
});

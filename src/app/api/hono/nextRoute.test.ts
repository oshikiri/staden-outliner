import { describe, expect, test } from "@jest/globals";

import { honoApiApp } from "./app";
import { honoInitializeApp } from "./initializeApp";
import { resolveApiApp } from "./nextRoute";

describe("api/hono/nextRoute", () => {
  test("resolves the initialize app for /api/initialize", () => {
    const request = new Request("http://localhost/api/initialize");
    expect(resolveApiApp(request)).toBe(honoInitializeApp);
  });

  test("resolves the main api app for other paths", () => {
    const request = new Request("http://localhost/api/pages/Page");
    expect(resolveApiApp(request)).toBe(honoApiApp);
  });
});

import { describe, expect, test } from "@jest/globals";

import { honoApiApp } from "./app";
import { honoInitializeApp } from "./initializeApp";
import { resolveApiApp } from "./apiRoute";

describe("api/hono/apiRoute", () => {
  test("resolves the initialize app for /api/initialize", () => {
    const request = new Request("http://localhost/api/initialize");
    expect(resolveApiApp(request)).toBe(honoInitializeApp);
  });

  test("resolves the main api app for other paths", () => {
    const request = new Request("http://localhost/api/pages/Page");
    expect(resolveApiApp(request)).toBe(honoApiApp);
  });

  test("adds CORS headers for cross-origin API requests", async () => {
    const request = new Request("http://127.0.0.1:3001/api/configs", {
      headers: {
        Origin: "http://localhost:5174",
      },
    });

    const response = await resolveApiApp(request).fetch(request);

    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5174",
    );
    expect(response.headers.get("vary")).toBe("Origin");
  });

  test("handles CORS preflight requests", async () => {
    const request = new Request("http://127.0.0.1:3001/api/pages/Page", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5174",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    const response = await resolveApiApp(request).fetch(request);

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5174",
    );
    expect(response.headers.get("access-control-allow-headers")).toBe(
      "Content-Type,Authorization",
    );
  });
});

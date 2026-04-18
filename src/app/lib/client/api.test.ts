import { afterEach, describe, expect, test, jest } from "@jest/globals";

import { apiFetch, apiUrl } from "./api";

describe("client/api", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const hadOriginalBaseUrl = Object.prototype.hasOwnProperty.call(
    process.env,
    "NEXT_PUBLIC_API_BASE_URL",
  );

  afterEach(() => {
    if (hadOriginalBaseUrl) {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    jest.restoreAllMocks();
  });

  test("keeps relative paths when no base url is configured", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(apiUrl("/api/files")).toBe("/api/files");
  });

  test("prefixes paths with the configured base url", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

    expect(apiUrl("/api/files?prefix=2026-04")).toBe(
      "https://api.example.test/api/files?prefix=2026-04",
    );
  });

  test("delegates fetch to the resolved absolute url", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok"));

    await apiFetch("/api/configs", {
      cache: "force-cache",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/configs",
      {
        cache: "force-cache",
      },
    );
  });
});

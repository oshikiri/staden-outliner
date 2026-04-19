import { afterEach, describe, expect, test, jest } from "bun:test";

import { apiFetch } from "./api";

describe("client/api", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("delegates fetch to the given path", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok"));

    await apiFetch("/api/configs", {
      cache: "force-cache",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/configs", {
      cache: "force-cache",
    });
  });
});

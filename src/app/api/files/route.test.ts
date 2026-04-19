import { beforeEach, describe, expect, jest, test } from "bun:test";

import * as PagesStore from "@/app/lib/sqlite/pages";

import { honoApiApp } from "@/app/api/hono/app";

jest.mock("@/app/lib/sqlite/pages", () => ({
  getPagesByPrefix: jest.fn(),
}));

describe("api/files/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET forwards the prefix query and returns files as json", async () => {
    const getPagesByPrefixMock = PagesStore.getPagesByPrefix;
    getPagesByPrefixMock.mockResolvedValue([
      { pageId: "1", title: "Page", path: "Page.md" },
    ]);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/files?prefix=Pa"),
    );

    expect(getPagesByPrefixMock).toHaveBeenCalledWith("Pa");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual([
      { pageId: "1", title: "Page", path: "Page.md" },
    ]);
  });
});

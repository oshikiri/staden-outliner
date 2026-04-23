import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const getPagesByPrefixMock = jest.fn();

mock.module("@/server/lib/sqlite/pageStore", () => ({
  getPagesByPrefix: getPagesByPrefixMock,
}));

import { honoApiApp } from "@/app/api/app";

describe("api/files/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET forwards the prefix query and returns files as json", async () => {
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

  test("GET defaults prefix to an empty string", async () => {
    getPagesByPrefixMock.mockResolvedValue([]);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/files"),
    );

    expect(getPagesByPrefixMock).toHaveBeenCalledWith("");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });
});

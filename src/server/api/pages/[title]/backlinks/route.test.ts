import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

import { Block } from "@/shared/markdown/block";
import { Text } from "@/shared/markdown/token";
const getSourceLinksMock = jest.fn();
const getCurrentPageMock = jest.fn();

mock.module("@/server/lib/sqlite", () => ({
  getSourceLinks: getSourceLinksMock,
  getCurrentPage: getCurrentPageMock,
}));

import { honoApiApp } from "@/server/api/app";

describe("api/pages/[title]/backlinks/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns backlink blocks as BlockDto[] with page context", async () => {
    const source = new Block([new Text("Source")], 2, []).withId("source-1");
    const parent = new Block([new Text("Parent")], 1, [source]).withId(
      "parent-1",
    );
    const page = new Block([new Text("Page")], 0, [parent]).withId("page-1");
    page.properties = [["title", "Page"]];
    parent.parent = page;
    source.parent = parent;

    getSourceLinksMock.mockResolvedValue(["source-1"]);
    getCurrentPageMock.mockResolvedValue(page);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/backlinks"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: "source-1",
        parentId: "parent-1",
        pageId: "page-1",
        properties: [["ancestors", "Parent"]],
        depth: 2,
        content: [{ type: 4, textContent: "Source" }],
        children: [],
      },
    ]);
  });

  test("GET returns 500 when the backlink source block is missing", async () => {
    const page = new Block([new Text("Page")], 0, []).withId("page-1");
    page.properties = [["title", "Page"]];

    getSourceLinksMock.mockResolvedValue(["source-1"]);
    getCurrentPageMock.mockResolvedValue(page);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/backlinks"),
    );

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      message: "Internal Server Error",
    });
  });
});

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { Block } from "@/app/lib/markdown/block";
import { Text } from "@/app/lib/markdown/token";
import * as Sqlite from "@/app/lib/sqlite";

import { GET } from "./route";

jest.mock("@/app/lib/sqlite", () => ({
  getSourceLinks: jest.fn(),
  getCurrentPage: jest.fn(),
}));

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

    const getSourceLinksMock = jest.mocked(Sqlite.getSourceLinks);
    const getCurrentPageMock = jest.mocked(Sqlite.getCurrentPage);
    getSourceLinksMock.mockResolvedValue(["source-1"]);
    getCurrentPageMock.mockResolvedValue(page);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ title: "Page" }),
    });

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
});

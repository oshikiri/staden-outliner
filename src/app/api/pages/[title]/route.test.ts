import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { Block } from "@/app/lib/markdown/block";
import { Marker, Text } from "@/app/lib/markdown/token";
import * as PageService from "@/app/lib/page/pageService";

import { GET, POST } from "./route";

describe("api/pages/[title]/route", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("GET returns an error response when title is missing", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ title: "" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      updateResults: {
        status: "unchanged",
        message: "Missing title",
      },
    });
  });

  test("GET returns page data as BlockDto", async () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    jest.spyOn(PageService, "getPageByTitle").mockResolvedValue(page);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ title: "Page" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "page-1",
      parentId: undefined,
      pageId: "page-1",
      properties: [["title", "Page"]],
      depth: 0,
      content: [{ type: 16, status: "TODO" }],
      children: [
        {
          id: "child-1",
          parentId: "page-1",
          pageId: "page-1",
          properties: undefined,
          depth: 1,
          content: [{ type: 4, textContent: "child" }],
          children: [],
        },
      ],
    });
  });

  test("POST parses BlockDto and returns updated page data", async () => {
    const updatedChild = new Block([new Text("child")], 1, []).withId(
      "child-1",
    );
    const updatedPage = new Block([new Marker("TODO")], 0, [
      updatedChild,
    ]).withId("page-1");
    updatedPage.properties = [["title", "Page"]];
    updatedChild.parent = updatedPage;

    const updateSpy = jest
      .spyOn(PageService, "updatePageByTitle")
      .mockResolvedValue(updatedPage);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "page-1",
          pageId: "page-1",
          depth: 0,
          content: [{ type: 16, status: "TODO" }],
          properties: [["title", "Page"]],
          children: [
            {
              id: "child-1",
              pageId: "page-1",
              parentId: "page-1",
              depth: 1,
              content: [{ type: 4, textContent: "child" }],
              children: [],
            },
          ],
        }),
      }),
      {
        params: Promise.resolve({ title: "Page" }),
      },
    );

    expect(updateSpy).toHaveBeenCalledWith("Page", expect.any(Block));
    const pagePayload = updateSpy.mock.calls[0][1];
    expect(pagePayload.id).toBe("page-1");
    expect(pagePayload.children[0].parent).toBe(pagePayload);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "page-1",
      parentId: undefined,
      pageId: "page-1",
      properties: [["title", "Page"]],
      depth: 0,
      content: [{ type: 16, status: "TODO" }],
      children: [
        {
          id: "child-1",
          parentId: "page-1",
          pageId: "page-1",
          properties: undefined,
          depth: 1,
          content: [{ type: 4, textContent: "child" }],
          children: [],
        },
      ],
    });
  });
});

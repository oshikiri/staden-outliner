import { beforeEach, describe, expect, jest, test } from "bun:test";

import { Block } from "@/shared/markdown/block";
import { Marker, Text } from "@/shared/markdown/token";
import * as PageService from "@/server/lib/page/pageService";

import { honoApiApp } from "@/app/api/app";

describe("api/pages/[title]/route", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("GET returns 404 when title is missing", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages"),
    );

    expect(response.status).toBe(404);
  });

  test("GET returns page data as BlockDto", async () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    jest.spyOn(PageService, "getPageByTitle").mockResolvedValue(page);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page"),
    );

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

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page", {
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

  test("POST returns 400 when page payload has invalid token shape", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "page-1",
          pageId: "page-1",
          depth: 0,
          content: [{}],
          children: [],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      updateResults: {
        status: "unchanged",
        message: "Missing page content",
      },
    });
  });

  test("POST returns 400 when page payload is malformed JSON", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      updateResults: {
        status: "unchanged",
        message: "Missing page content",
      },
    });
  });

  test("POST returns 404 when title is missing", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(404);
  });
});

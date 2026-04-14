import { describe, expect, test } from "@jest/globals";

import { Block } from "./block";
import { BlockDto, fromBlockDto, toBlockDto } from "./blockDto";
import { Marker, Text } from "./token";

describe("blockDto", () => {
  test("toBlockDto converts a block tree into a transport shape", () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    child.contentMarkdown = "child";
    child.properties = [["note", "child"]];
    child.pageId = "page-1";
    child.parentId = "page-1";

    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.contentMarkdown = "TODO";
    page.pageId = "page-1";
    page.properties = [["title", "Page"]];
    child.parent = page;

    const dto = toBlockDto(page);

    expect(dto).toEqual({
      id: "page-1",
      parentId: undefined,
      pageId: "page-1",
      contentMarkdown: "TODO",
      properties: [["title", "Page"]],
      depth: 0,
      content: [{ type: 16, status: "TODO" }],
      children: [
        {
          id: "child-1",
          parentId: "page-1",
          pageId: "page-1",
          contentMarkdown: "child",
          properties: [["note", "child"]],
          depth: 1,
          content: [{ type: 4, textContent: "child" }],
          children: [],
        },
      ],
    });
  });

  test("fromBlockDto restores tokens and parent links", () => {
    const dto: BlockDto = {
      id: "page-1",
      pageId: "page-1",
      depth: 0,
      contentMarkdown: "TODO",
      content: [{ type: 16, status: "TODO" }],
      properties: [["title", "Page"]],
      children: [
        {
          id: "child-1",
          pageId: "page-1",
          parentId: "page-1",
          depth: 1,
          contentMarkdown: "child",
          content: [{ type: 4, textContent: "child" }],
          properties: [["note", "child"]],
          children: [],
        },
      ],
    };

    const block = fromBlockDto(dto);

    expect(block.id).toBe("page-1");
    expect(block.pageId).toBe("page-1");
    expect(block.contentMarkdown).toBe("TODO");
    expect(block.content[0]).toStrictEqual(new Marker("TODO"));
    expect(block.getProperty("title")).toBe("Page");
    expect(block.children[0].parent).toBe(block);
    expect(block.children[0].parentId).toBe("page-1");
    expect(block.children[0].content[0]).toStrictEqual(new Text("child"));
    expect(block.children[0].getProperty("note")).toBe("child");
  });
});

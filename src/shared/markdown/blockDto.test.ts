import { describe, expect, test } from "bun:test";

import { Block } from "./block";
import {
  BlockDto,
  fromBlockDto,
  isBlockDto,
  toBlockDto,
  toPageDto,
} from "./blockDto";
import { Marker, Text } from "./token";

describe("blockDto", () => {
  test("toPageDto converts a block tree into a transport shape", () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    child.properties = [["note", "child"]];

    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    const dto = toPageDto(page);

    expect(dto).toEqual({
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
          properties: [["note", "child"]],
          depth: 1,
          content: [{ type: 4, textContent: "child" }],
          children: [],
        },
      ],
    });
  });

  test("toBlockDto converts a subtree when pageId is given explicitly", () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    child.properties = [["note", "child"]];

    const dto = toBlockDto(child, {
      pageId: "page-1",
      parentId: "page-1",
    });

    expect(dto).toEqual({
      id: "child-1",
      parentId: "page-1",
      pageId: "page-1",
      properties: [["note", "child"]],
      depth: 1,
      content: [{ type: 4, textContent: "child" }],
      children: [],
    });
  });

  test("fromBlockDto restores tokens and parent links", () => {
    const dto: BlockDto = {
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
          properties: [["note", "child"]],
          children: [],
        },
      ],
    };

    const block = fromBlockDto(dto);

    expect(block.id).toBe("page-1");
    expect(block.content[0]).toStrictEqual(new Marker("TODO"));
    expect(block.getProperty("title")).toBe("Page");
    expect(block.children[0].parent).toBe(block);
    expect(block.children[0].content[0]).toStrictEqual(new Text("child"));
    expect(block.children[0].getProperty("note")).toBe("child");
  });

  test("isBlockDto accepts valid nested block payloads", () => {
    const dto: BlockDto = {
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
          properties: [["note", "child"]],
          children: [],
        },
      ],
    };

    expect(isBlockDto(dto)).toBe(true);
  });

  test("isBlockDto rejects malformed token payloads", () => {
    expect(
      isBlockDto({
        depth: 0,
        content: [{}],
        children: [],
      }),
    ).toBe(false);
  });

  test("isBlockDto rejects token payloads with missing required fields", () => {
    expect(
      isBlockDto({
        depth: 0,
        content: [{ type: 4 }],
        children: [],
      }),
    ).toBe(false);
  });

  test("isBlockDto rejects the internal base token type", () => {
    expect(
      isBlockDto({
        depth: 0,
        content: [{ type: 0 }],
        children: [],
      }),
    ).toBe(false);
  });
});

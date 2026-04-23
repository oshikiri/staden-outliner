import { describe, expect, test } from "bun:test";

import { Block } from "@/app/lib/markdown/block";
import { Marker, Text } from "@/app/lib/markdown/token";

import {
  createPageBlockFromRows,
  toBlockInsertRecord,
} from "./blockRecordMapper";

describe("blockRecordMapper", () => {
  test("createPageBlockFromRows rebuilds a tree with parent links", () => {
    const page = createPageBlockFromRows([
      {
        id: "page-1",
        page_id: "page-1",
        parent_id: null,
        depth: 0,
        order_index: 0,
        content: JSON.stringify([{ type: 16, status: "TODO" }]),
        page_title: "Page",
      },
      {
        id: "child-1",
        page_id: "page-1",
        parent_id: "page-1",
        depth: 1,
        order_index: 0,
        content: JSON.stringify([{ type: 4, textContent: "child" }]),
        page_title: "Page",
      },
    ]);

    expect(page.id).toBe("page-1");
    expect(page.getProperty("title")).toBe("Page");
    expect(page.content[0]).toStrictEqual(new Marker("TODO"));
    expect(page.children[0].content[0]).toStrictEqual(new Text("child"));
    expect(page.children[0].parent).toBe(page);
  });

  test("toBlockInsertRecord derives page and parent ids from context", () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    expect(
      toBlockInsertRecord(child, {
        defaultPageId: "page-1",
      }),
    ).toEqual([
      "child-1",
      "page-1",
      "page-1",
      1,
      0,
      JSON.stringify(child.content),
      "child",
      JSON.stringify({}),
    ]);
  });

  test("toBlockInsertRecord throws when pageId context is missing", () => {
    const block = new Block([], 0, []).withId("page-1");

    expect(() => toBlockInsertRecord(block, {})).toThrow(
      "Missing pageId for block: page-1",
    );
  });
});

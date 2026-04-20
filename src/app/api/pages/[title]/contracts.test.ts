import { describe, expect, test } from "bun:test";

import { Block } from "@/app/lib/markdown/block";
import { Marker, Text } from "@/app/lib/markdown/token";
import { toPageDto } from "@/app/lib/markdown/blockDto";

import {
  createPageRouteError,
  isPageRouteError,
  serializePageRequest,
} from "./contracts";

describe("api/pages/[title]/contracts", () => {
  test("serializes page requests from the transport shape", () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    const serialized = serializePageRequest(page);
    expect(JSON.parse(serialized)).toEqual(toPageDto(page));
  });

  test("builds the page route error contract", () => {
    const error = createPageRouteError("Missing title");

    expect(isPageRouteError(error)).toBe(true);
    expect(error).toEqual({
      updateResults: {
        status: "unchanged",
        message: "Missing title",
      },
    });
  });
});

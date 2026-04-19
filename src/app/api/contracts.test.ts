import { describe, expect, test } from "bun:test";

import { Block } from "@/app/lib/markdown/block";
import { Marker, Text } from "@/app/lib/markdown/token";
import { toPageDto } from "@/app/lib/markdown/blockDto";

import {
  createPageRouteError,
  filesRoutePath,
  isPageRouteError,
  pageBacklinksRoutePath,
  pageRoutePath,
  pageUpdateMarkdownRoutePath,
  serializePageRequest,
} from "./contracts";

describe("api/contracts", () => {
  test("builds encoded route paths", () => {
    expect(pageRoutePath("Daily Notes/2026-04-18")).toBe(
      "/api/pages/Daily%20Notes%2F2026-04-18",
    );
    expect(pageBacklinksRoutePath("Daily Notes")).toBe(
      "/api/pages/Daily%20Notes/backlinks",
    );
    expect(pageUpdateMarkdownRoutePath("Daily Notes")).toBe(
      "/api/pages/Daily%20Notes/update_markdown",
    );
    expect(filesRoutePath("Daily Notes")).toBe("/api/files?prefix=Daily+Notes");
  });

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

  test("keeps the route response payloads consistent", async () => {
    const page = new Block([new Text("Source")], 2, []).withId("source-1");
    page.properties = [["title", "Source"]];
    const dto = toPageDto(page);

    const backlinksResponse = new Response(JSON.stringify([dto]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    await expect(backlinksResponse.json()).resolves.toEqual([dto]);
  });
});

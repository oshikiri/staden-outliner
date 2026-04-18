import { describe, expect, test } from "@jest/globals";

import { Block } from "@/app/lib/markdown/block";
import { Marker, Text } from "@/app/lib/markdown/token";
import { toPageDto } from "@/app/lib/markdown/blockDto";

import {
  expectEmptyJsonResponse,
  expectNoContentResponse,
  filesRoutePath,
  pageBacklinksRoutePath,
  pageRoutePath,
  pageUpdateMarkdownRoutePath,
  readBacklinksResponse,
  readConfigsResponse,
  readFilesResponse,
  readPageResponse,
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

  test("reads page responses through the shared contract", async () => {
    const child = new Block([new Text("child")], 1, []).withId("child-1");
    const page = new Block([new Marker("TODO")], 0, [child]).withId("page-1");
    page.properties = [["title", "Page"]];
    child.parent = page;

    const response = new Response(JSON.stringify(toPageDto(page)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const parsed = await readPageResponse(response);

    expect(parsed.id).toBe("page-1");
    expect(parsed.children[0].id).toBe("child-1");
    expect(parsed.getProperty("title")).toBe("Page");
  });

  test("raises the route error message for page errors", async () => {
    const response = new Response(
      JSON.stringify({
        updateResults: {
          status: "unchanged",
          message: "Missing title",
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(readPageResponse(response)).rejects.toThrow("Missing title");
  });

  test("reads backlinks, configs, files, and empty payloads", async () => {
    const page = new Block([new Text("Source")], 2, []).withId("source-1");
    page.properties = [["title", "Source"]];
    const dto = toPageDto(page);

    const backlinksResponse = new Response(JSON.stringify([dto]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const configsResponse = new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const filesResponse = new Response(JSON.stringify([{ title: "Page" }]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const emptyResponse = new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const noContentResponse = new Response(null, { status: 204 });

    const backlinks = await readBacklinksResponse(backlinksResponse);
    const configs = await readConfigsResponse(configsResponse);
    const files = await readFilesResponse(filesResponse);
    const empty = await expectEmptyJsonResponse(emptyResponse);

    expect(backlinks[0].id).toBe("source-1");
    expect(configs).toEqual({ favorites: [] });
    expect(files).toEqual([{ title: "Page" }]);
    expect(empty).toEqual({});

    await expect(
      expectNoContentResponse(noContentResponse),
    ).resolves.toBeUndefined();
  });
});

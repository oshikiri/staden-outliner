import { afterEach, describe, expect, jest, test } from "bun:test";

import { pageRpc } from "./page";

describe("api/rpc/page", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("get rejects invalid page payload shapes", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: [{}], depth: 0, children: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(pageRpc.get("Page")).rejects.toThrow(
      "Unexpected response shape: 200",
    );
  });

  test("get encodes page titles in the request path", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "page-1",
          pageId: "page-1",
          depth: 0,
          content: [{ type: 16, status: "TODO" }],
          children: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await pageRpc.get("Page / Draft");

    const request = fetchMock.mock.calls[0][0];
    const url =
      typeof request === "string"
        ? request
        : request instanceof Request
          ? request.url
          : request.toString();
    expect(url).toContain("/api/pages/Page%20%2F%20Draft");
  });

  test("reflectMarkdown requires no content", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(pageRpc.reflectMarkdown("Page")).resolves.toBeUndefined();
  });
});

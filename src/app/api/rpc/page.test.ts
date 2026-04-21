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
});

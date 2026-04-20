import { describe, expect, test } from "bun:test";

import { expectStatus, readJsonResponse } from "./response";

describe("api/rpc/response", () => {
  test("readJsonResponse returns parsed json for the expected status", async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    await expect(readJsonResponse<{ ok: boolean }>(response)).resolves.toEqual({
      ok: true,
    });
  });

  test("readJsonResponse throws the page route message for page errors", async () => {
    const response = new Response(
      JSON.stringify({
        updateResults: {
          status: "unchanged",
          message: "Missing page content",
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(readJsonResponse(response)).rejects.toThrow(
      "Missing page content",
    );
  });

  test("readJsonResponse throws the global message for json errors", async () => {
    const response = new Response(
      JSON.stringify({
        message: "Internal Server Error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(readJsonResponse(response)).rejects.toThrow(
      "Internal Server Error",
    );
  });

  test("expectStatus accepts the expected empty response", async () => {
    const response = new Response(null, {
      status: 204,
    });

    await expect(expectStatus(response, 204)).resolves.toBeUndefined();
  });

  test("expectStatus throws for unexpected status without json body", async () => {
    const response = new Response("Bad Gateway", {
      status: 502,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    await expect(expectStatus(response, 204)).rejects.toThrow("Bad Gateway");
  });
});

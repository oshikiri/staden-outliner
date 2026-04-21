import { afterEach, describe, expect, jest, test } from "bun:test";

import { systemRpc } from "./system";

describe("api/rpc/system", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("configs rejects invalid payload shapes", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ favorites: ["ok", 1] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(systemRpc.configs()).rejects.toThrow(
      "Unexpected response shape: 200",
    );
  });

  test("files rejects invalid payload shapes", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ title: 1 }]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(systemRpc.files()).rejects.toThrow(
      "Unexpected response shape: 200",
    );
  });
});

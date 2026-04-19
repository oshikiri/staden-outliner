import { describe, expect, test } from "bun:test";

import { resolveApiServerOptions } from "./api";

describe("server/api", () => {
  test("uses the Bun API server defaults", () => {
    expect(resolveApiServerOptions()).toEqual({
      host: "127.0.0.1",
      port: 3001,
    });
  });

  test("allows overriding the Bun API server host and port", () => {
    expect(
      resolveApiServerOptions({
        host: "0.0.0.0",
        port: 8080,
      }),
    ).toEqual({
      host: "0.0.0.0",
      port: 8080,
    });
  });
});

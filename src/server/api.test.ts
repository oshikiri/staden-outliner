import { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

import { describe, expect, test } from "bun:test";

import { toRequest } from "./api";

describe("server/api", () => {
  test("builds a Request from the incoming message", async () => {
    const incoming = Readable.from([Buffer.from("payload")]) as IncomingMessage;
    Object.assign(incoming, {
      headers: {
        host: "example.test:3001",
        "x-custom": "abc",
      },
      method: "POST",
      url: "/api/pages/Page?draft=1",
    });

    const request = toRequest(incoming, "127.0.0.1", 3001);

    expect(request.url).toBe("http://example.test:3001/api/pages/Page?draft=1");
    expect(request.headers.get("x-custom")).toBe("abc");
    expect(await request.text()).toBe("payload");
  });
});

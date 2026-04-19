import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const readFileMock = jest.fn();
const getStadenRootMock = jest.fn(() => "/staden");

mock.module("fs", () => ({
  promises: {
    readFile: readFileMock,
  },
}));

mock.module("@/app/lib/env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));

import { honoApiApp } from "@/app/api/hono/app";

describe("api/images/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns 400 when path is missing", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/images"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")?.toLowerCase()).toBe(
      "text/plain; charset=utf-8",
    );
    await expect(response.text()).resolves.toBe("Missing path parameter");
  });

  test("GET rejects paths outside STADEN_ROOT", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/images?path=../secret.png"),
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid image path");
  });

  test("GET returns image bytes with mime type", async () => {
    const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    readFileMock.mockResolvedValue(imageBuffer);

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/images?path=images/sample.png"),
    );

    expect(getStadenRootMock).toHaveBeenCalled();
    expect(readFileMock).toHaveBeenCalledWith("/staden/images/sample.png");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe(
      "cross-origin",
    );
    expect(Buffer.from(await response.arrayBuffer())).toEqual(imageBuffer);
  });
});

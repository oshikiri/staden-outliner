import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const getStadenRootMock = jest.fn(() => "/staden");

mock.module("@/app/lib/env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));

import { honoApiApp } from "@/app/api/hono/app";

describe("api/images/route", () => {
  beforeEach(() => {
    getStadenRootMock.mockReset();
    getStadenRootMock.mockReturnValue("/staden");
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

  test("GET rejects paths outside the vault root", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/images?path=../secret.png"),
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid image path");
  });

  test("GET returns 404 when the image does not exist", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staden-images-"));
    try {
      getStadenRootMock.mockReturnValue(tempRoot);

      const response = await honoApiApp.fetch(
        new Request("http://localhost/api/images?path=images/missing.png"),
      );

      expect(response.status).toBe(404);
      await expect(response.text()).resolves.toBe("Image not found");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("GET returns image bytes with mime type", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staden-images-"));
    try {
      const imagePath = path.join(tempRoot, "images/sample.png");
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });

      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      fs.writeFileSync(imagePath, imageBuffer);
      getStadenRootMock.mockReturnValue(tempRoot);

      const response = await honoApiApp.fetch(
        new Request("http://localhost/api/images?path=images/sample.png"),
      );

      expect(getStadenRootMock).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/png");
      expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe(
        "cross-origin",
      );
      expect(Buffer.from(await response.arrayBuffer())).toEqual(imageBuffer);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

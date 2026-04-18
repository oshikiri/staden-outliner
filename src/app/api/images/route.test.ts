import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const readFileMock = jest.fn();
const getStadenRootMock = jest.fn(() => "/staden");

jest.mock("fs", () => ({
  promises: {
    readFile: readFileMock,
  },
}));

jest.mock("@/app/lib/env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));

import { GET } from "./route";

describe("api/images/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns 400 when path is missing", async () => {
    const response = await GET(new Request("http://localhost/api/images"));

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    await expect(response.text()).resolves.toBe("Missing path parameter");
  });

  test("GET rejects paths outside STADEN_ROOT", async () => {
    const response = await GET(
      new Request("http://localhost/api/images?path=../secret.png"),
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid image path");
  });

  test("GET returns image bytes with mime type", async () => {
    const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    readFileMock.mockResolvedValue(imageBuffer);

    const response = await GET(
      new Request("http://localhost/api/images?path=images/sample.png"),
    );

    expect(getStadenRootMock).toHaveBeenCalled();
    expect(readFileMock).toHaveBeenCalledWith("/staden/images/sample.png");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(imageBuffer);
  });
});

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import * as Exporter from "@/app/lib/exporter/incremental_exporter";

import { POST } from "./route";

jest.mock("@/app/lib/exporter/incremental_exporter", () => ({
  exportOnePageToMarkdown: jest.fn(),
}));

describe("api/pages/[title]/update_markdown/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST exports the page markdown and returns an empty json object", async () => {
    const exportMock = jest.mocked(Exporter.exportOnePageToMarkdown);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ title: "Page" }),
    });

    expect(exportMock).toHaveBeenCalledWith("Page");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({});
  });
});

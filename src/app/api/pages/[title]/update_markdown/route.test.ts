import { beforeEach, describe, expect, jest, test } from "bun:test";

import * as Exporter from "@/app/lib/exporter/incremental_exporter";

import { honoApiApp } from "@/app/api/hono/app";

jest.mock("@/app/lib/exporter/incremental_exporter", () => ({
  exportOnePageToMarkdown: jest.fn(),
}));

describe("api/pages/[title]/update_markdown/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST exports the page markdown and returns an empty json object", async () => {
    const exportMock = Exporter.exportOnePageToMarkdown;

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/update_markdown", {
        method: "POST",
      }),
    );

    expect(exportMock).toHaveBeenCalledWith("Page");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({});
  });

  test("POST returns 500 when export fails inside the Hono app", async () => {
    const exportMock = Exporter.exportOnePageToMarkdown;
    exportMock.mockRejectedValue(new Error("export failed"));

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/update_markdown", {
        method: "POST",
      }),
    );

    expect(exportMock).toHaveBeenCalledWith("Page");
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=UTF-8",
    );
    await expect(response.text()).resolves.toBe("Internal Server Error");
  });
});

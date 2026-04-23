import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const exportOnePageToMarkdownMock = jest.fn();

mock.module("@/server/lib/exporter/incremental_exporter", () => ({
  exportOnePageToMarkdown: exportOnePageToMarkdownMock,
}));

import { honoApiApp } from "@/app/api/hono/app";

describe("api/pages/[title]/update_markdown/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST exports the page markdown and returns no content", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/update_markdown", {
        method: "POST",
      }),
    );

    expect(exportOnePageToMarkdownMock).toHaveBeenCalledWith("Page");
    expect(response.status).toBe(204);
    expect(response.headers.get("Content-Type")).toBeNull();
    await expect(response.text()).resolves.toBe("");
  });

  test("POST returns 500 when export fails inside the Hono app", async () => {
    exportOnePageToMarkdownMock.mockRejectedValue(new Error("export failed"));

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/pages/Page/update_markdown", {
        method: "POST",
      }),
    );

    expect(exportOnePageToMarkdownMock).toHaveBeenCalledWith("Page");
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      message: "Internal Server Error",
    });
  });
});

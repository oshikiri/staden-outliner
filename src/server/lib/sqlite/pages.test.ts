import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const queryAllMock = jest.fn();
const queryMock = jest.fn(() => ({
  all: queryAllMock,
}));

mock.module("./index", () => ({
  getDb: jest.fn(() => ({
    query: queryMock,
  })),
}));

import { getPagesByTitles } from "./pages";

describe("sqlite/pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPagesByTitles returns empty array without querying when titles are empty", async () => {
    await expect(getPagesByTitles([])).resolves.toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  test("getPagesByTitles builds placeholders for each title", async () => {
    queryAllMock.mockReturnValue([
      {
        id: "page-1",
        title: "Page",
        path: "/tmp/Page.md",
      },
    ]);

    await expect(getPagesByTitles(["Page", "Other"])).resolves.toEqual([
      {
        pageId: "page-1",
        title: "Page",
        path: "/tmp/Page.md",
      },
    ]);

    expect(queryMock).toHaveBeenCalledWith(
      "SELECT * FROM pages WHERE title IN (?, ?);",
    );
    expect(queryAllMock).toHaveBeenCalledWith("Page", "Other");
  });
});

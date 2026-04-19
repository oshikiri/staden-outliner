import { describe, expect, test } from "bun:test";

import { appendRecentPage } from "./recentPages";

describe("recentPages", () => {
  test("adds a new page to the front", () => {
    expect(appendRecentPage(["b", "c"], "a")).toEqual(["a", "b", "c"]);
  });

  test("moves an existing page to the front without duplicating it", () => {
    expect(appendRecentPage(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  test("trims the list to the maximum size", () => {
    expect(
      appendRecentPage(
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        "11",
      ),
    ).toEqual(["11", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  test("ignores empty titles", () => {
    expect(appendRecentPage(["a"], "   ")).toEqual(["a"]);
  });
});

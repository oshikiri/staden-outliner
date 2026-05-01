import { describe, expect, test } from "bun:test";

import { normalizePageTitles } from "./usePageTitles";

describe("normalizePageTitles", () => {
  test("deduplicates titles and sorts them", () => {
    expect(
      normalizePageTitles([
        { title: "b" },
        { title: "a" },
        { title: "b" },
        { title: "c" },
      ]),
    ).toEqual(["a", "b", "c"]);
  });
});

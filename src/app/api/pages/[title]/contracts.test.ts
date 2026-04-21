import { describe, expect, test } from "bun:test";

import { createPageRouteError, isPageRouteError } from "./contracts";

describe("api/pages/[title]/contracts", () => {
  test("builds the page route error contract", () => {
    const error = createPageRouteError("Missing title");

    expect(isPageRouteError(error)).toBe(true);
    expect(error).toEqual({
      updateResults: {
        status: "unchanged",
        message: "Missing title",
      },
    });
  });
});

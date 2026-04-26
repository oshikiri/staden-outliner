import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

let recentPages = ["current", "older-page"];

mock.module("react", () => ({
  useEffect: () => undefined,
  useState: () => [recentPages, () => undefined],
}));

mock.module("@/client/recentPagesStorage", () => ({
  appendAndSaveRecentPage: (pageTitle: string) => [pageTitle, "older-page"],
}));

import { RecentPages } from "./RecentPages";

describe("RecentPages", () => {
  test("renders the recent pages in order", () => {
    const markup = renderToStaticMarkup(<RecentPages pageTitle="current" />);

    expect(markup).toContain('href="/pages/current"');
    expect(markup).toContain('href="/pages/older-page"');
    expect(markup.indexOf("current")).toBeLessThan(
      markup.indexOf("older-page"),
    );
  });
});

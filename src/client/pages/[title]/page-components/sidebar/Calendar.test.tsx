import { afterAll, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("react", () => ({
  useEffect: () => undefined,
  useState: (initial: unknown) => [initial, () => undefined] as const,
}));

mock.module("@/client/usePageTitles", () => ({
  usePageTitles: () => ["2026-04-01", "2026-04-02"],
}));

mock.module("../../navigation", () => ({
  usePageNavigation: () => ({
    navigateToPage: () => undefined,
  }),
}));

import { JournalCalendar } from "./Calendar";

describe("JournalCalendar", () => {
  test("renders the current month and journal day links", () => {
    const markup = renderToStaticMarkup(
      <JournalCalendar pathname="/pages/2026-04-26" />,
    );

    expect(markup).toContain("2026-04");
    expect(markup).toContain('href="/pages/2026-04-01"');
    expect(markup).toContain('href="/pages/2026-04-02"');
  });
});

afterAll(() => {
  mock.restore();
});

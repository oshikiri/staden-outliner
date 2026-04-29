import { afterAll, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

let stateIndex = 0;

mock.module("react", () => ({
  useEffect: () => undefined,
  useState: (initial: unknown) => {
    stateIndex += 1;
    if (stateIndex === 1) {
      return [["2026-04-01", "2026-04-02"], () => undefined] as const;
    }
    if (stateIndex === 2) {
      return ["2026-04", () => undefined] as const;
    }
    return [initial, () => undefined] as const;
  },
}));

mock.module("@/client/rpc/system", () => ({
  systemRpc: {
    files: async (month?: string) => [
      { title: `${month}-01`, pageId: "id-1" },
      { title: `${month}-02`, pageId: "id-2" },
    ],
  },
}));

mock.module("../../navigation", () => ({
  usePageNavigation: () => ({
    navigateToPage: () => undefined,
  }),
}));

import { JournalCalendar } from "./Calendar";

describe("JournalCalendar", () => {
  test("renders the current month and journal day links", () => {
    stateIndex = 0;
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

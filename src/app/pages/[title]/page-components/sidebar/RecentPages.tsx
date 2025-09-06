import { JSX } from "react";

import { PageRef } from "../../token";
import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";

export function RecentPages({ pageTitle }: { pageTitle: string }): JSX.Element {
  const recentPages = appendAndGetRecentPage(pageTitle);
  return (
    <div>
      {recentPages?.reverse().map((page, key) => (
        <div key={key}>
          📓 <PageRef pageref={new PageRefEntity(page)} />
        </div>
      ))}
    </div>
  );
}

function appendAndGetRecentPage(pageTitle: string): string[] {
  // RV: localStorage access assumes browser context; ensure this code only runs in client components.
  let recentPages: string[] = JSON.parse(
    localStorage.getItem("recentPages") || "[]",
  ) as string[];

  const recentPagesSet: Set<string> = new Set(recentPages);
  recentPagesSet.delete(pageTitle);
  recentPagesSet.add(pageTitle);

  recentPages = Array.from(recentPagesSet);
  recentPages = recentPages.slice(-10);
  // RV: No error handling for storage quota exceeded; wrap in try/catch.
  localStorage.setItem("recentPages", JSON.stringify(recentPages));

  return recentPages;
}

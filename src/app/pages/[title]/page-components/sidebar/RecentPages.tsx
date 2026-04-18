"use client";

import { JSX, useEffect, useState } from "react";

import { appendAndSaveRecentPage } from "@/app/lib/client/recentPagesStorage";
import { PageRef } from "../../token";
import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";

export function RecentPages({ pageTitle }: { pageTitle: string }): JSX.Element {
  const [recentPages, setRecentPages] = useState<string[]>([]);

  useEffect(() => {
    setRecentPages(appendAndSaveRecentPage(pageTitle));
  }, [pageTitle]);

  return (
    <div>
      {recentPages.map((page, key) => (
        <div key={key}>
          📓 <PageRef pageref={new PageRefEntity(page)} />
        </div>
      ))}
    </div>
  );
}

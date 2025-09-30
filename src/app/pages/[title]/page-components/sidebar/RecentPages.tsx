"use client";

import { JSX, useEffect, useState } from "react";

import { PageRef } from "../../token";
import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";

export function RecentPages({ pageTitle }: { pageTitle: string }): JSX.Element {
  const [recentPages, setRecentPages] = useState<string[]>([]);

  useEffect(() => {
    let canceled = false;

    appendAndGetRecentPage(pageTitle)
      .then((pages) => {
        if (!canceled) {
          setRecentPages(pages);
        }
      })
      .catch((error) => {
        console.error("Failed to load recent pages", error);
      });

    return () => {
      canceled = true;
    };
  }, [pageTitle]);

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

async function appendAndGetRecentPage(pageTitle: string): Promise<string[]> {
  const response = await fetch("/api/recent-pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pageTitle }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to update recent pages: ${response.status}`);
  }

  const data: { pages: string[] } = await response.json();
  return data.pages;
}

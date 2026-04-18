"use client";

import { useEffect } from "react";

import { StadenDate } from "@/app/lib/date";

export function HomeScreen({
  navigateToPage,
}: {
  navigateToPage: (path: string) => void;
}) {
  useEffect(() => {
    const title = new StadenDate().format();
    navigateToPage(`/pages/${encodeURIComponent(title)}`);
  }, [navigateToPage]);

  return null;
}

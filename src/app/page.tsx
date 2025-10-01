"use client";

import type { JSX } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { StadenDate } from "@/app/lib/date";

export default function Home(): JSX.Element | null {
  const router = useRouter();

  useEffect(() => {
    const title = new StadenDate().format();
    router.replace(`/pages/${encodeURIComponent(title)}`);
  }, [router]);

  return null;
}

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { HomeScreen } from "./home/HomeScreen";

export default function Home() {
  const router = useRouter();

  const navigateToPage = useCallback(
    (path: string) => {
      router.replace(path);
    },
    [router],
  );

  return <HomeScreen navigateToPage={navigateToPage} />;
}

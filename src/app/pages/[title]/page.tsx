"use client";

import { useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { PageScreen } from "./PageScreen";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ title: string }>();
  const title = params.title ?? "";
  const navigateToPage = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  return (
    <PageScreen
      title={title}
      pathname={pathname}
      navigateToPage={navigateToPage}
    />
  );
}

"use client";

// RV: Move this route from src/app/pages/[title] to src/app/[title] to match App Router conventions.

import { JSX, useEffect } from "react";
import { useParams } from "next/navigation";

import { Block as BlockEntity } from "@/app/lib/markdown/block";
import Block from "./block";
import { BacklinksContainer } from "./page-components/Backlink";
import { SideBar } from "./page-components/sidebar";
import { useStore } from "./state";
import { getPageByTitle } from "./api";

export default function Page() {
  const params = useParams<{ title: string }>();
  const title = decodeURIComponent(params.title);

  const block = useStore((state) => state.page);
  const setPage = useStore((state) => state.setPage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      // RV: Use Next.js metadata API instead of directly mutating document.title.
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    getPageByTitle(title).then((block) => {
      // RV: Remove console.log before production; prefer a scoped logger.
      console.log("pageUpdate", block);
      setPage(block);
    });
    // RV: Avoid disabling exhaustive-deps; include dependencies or refactor effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  if (!block) {
    return <></>;
  }

  // RV: Register global key handlers in useEffect and clean up to prevent leaks.
  window.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      document.getElementById("page-search")?.focus();
    }
  };

  const titleFromProperty = (block.getProperty("title") as string) || title;

  return (
    <>
      {/* RV: Remove inline <title>; rely on metadata or Head component. */}
      <title>{titleFromProperty}</title>
      <h1
        className="
          text-3xl
          sticky top-0
          text-title
          bg-background
          border-b border-primary/20
          pl-5 py-2
          mb-4
          z-100
        "
      >
        {titleFromProperty}
      </h1>
      <PageContent blocks={block?.children} />
      <BacklinksContainer pageTitle={title} />
      <SideBar pageTitle={title} />
    </>
  );
}

function PageContent({
  blocks,
}: {
  blocks: BlockEntity[] | undefined;
}): JSX.Element {
  return (
    <div>
      {blocks?.map((childBlock: BlockEntity) => {
        return <Block block={childBlock} key={childBlock.id} />;
      })}
    </div>
  );
}

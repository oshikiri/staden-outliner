"use client";

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
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    getPageByTitle(title).then((block) => {
      console.log("pageUpdate", block);
      setPage(block);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
  // RV: No error handling; if fetch fails, the page stays blank without feedback.

  if (!block) {
    return <></>;
  }

  // RV: Assigning to `window.onkeydown` inside render can cause leaks and duplicate handlers. Use `useEffect` with `addEventListener` and cleanup.
  window.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      document.getElementById("page-search")?.focus();
    }
  };

  const titleFromProperty = (block.getProperty("title") as string) || title;

  return (
    <>
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
          z-10
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

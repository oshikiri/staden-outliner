"use client";

import { JSX, useEffect } from "react";

import { Block as BlockEntity } from "@/app/lib/markdown/block";
import Block from "./block";
import { BacklinksContainer } from "./page-components/Backlink";
import { SideBar } from "./page-components/sidebar";
import { PageNavigationProvider } from "./navigation";
import { useStore } from "./state";
import { getPageByTitle } from "./api";

// eslint-disable-next-line max-lines-per-function
export function PageScreen({
  title,
  pathname,
  navigateToPage,
}: {
  title: string;
  pathname: string;
  navigateToPage: (path: string) => void;
}) {
  const block = useStore((state) => state.page);
  const setPage = useStore((state) => state.setPage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    getPageByTitle(title).then((nextBlock) => {
      console.log("pageUpdate", nextBlock);
      setPage(nextBlock);
    });
  }, [title]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && e.ctrlKey) {
        e.preventDefault();
        document.getElementById("page-search")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!block) {
    return <></>;
  }

  const titleFromProperty = (block.getProperty("title") as string) || title;

  return (
    <PageNavigationProvider navigateToPage={navigateToPage}>
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
        <SideBar pageTitle={title} pathname={pathname} />
      </>
    </PageNavigationProvider>
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

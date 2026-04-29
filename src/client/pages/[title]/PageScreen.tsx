import { useEffect } from "react";

import Block from "./block";
import { BacklinksContainer } from "./page-components/Backlink";
import { SideBar } from "./page-components/sidebar";
import { PageNavigationProvider } from "./navigation";
import { useStore } from "./state";
import { pageRpc } from "@/client/rpc/page";
import { logDebug, logError } from "@/shared/logger";
import { isAbortError } from "@/client/request";

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
    const controller = new AbortController();

    pageRpc
      .get(title, { signal: controller.signal })
      .then((nextBlock) => {
        if (controller.signal.aborted) {
          return;
        }
        logDebug("pageUpdate", nextBlock?.id);
        setPage(nextBlock);
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        logError("Failed to load page", error);
      });

    return () => {
      controller.abort();
    };
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
        <div className="mx-auto w-full max-w-[120rem] px-4 py-4 lg:px-6">
          <main>
            <h1
              className="
                sticky top-0 z-10 flex items-center justify-between gap-4
                border-b border-primary/20
                bg-background
                py-2 pl-5 mb-4
              "
            >
              <span className="text-3xl text-title">{titleFromProperty}</span>
            </h1>
            <div>
              {block?.children?.map((childBlock) => {
                return <Block block={childBlock} key={childBlock.id} />;
              })}
            </div>
            <BacklinksContainer pageTitle={title} />
          </main>
          <SideBar pageTitle={title} pathname={pathname} />
        </div>
      </>
    </PageNavigationProvider>
  );
}

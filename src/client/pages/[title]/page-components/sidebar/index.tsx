import { JSX, useState } from "react";

import { PageRef as PageRefEntity } from "@/shared/markdown/token";
import { StadenDate } from "@/shared/date";
import { systemRpc } from "@/client/rpc/system";
import { logError } from "@/shared/logger";
import { isAbortError } from "@/client/request";
import { useAbortableEffect } from "@/client/useAbortableEffect";
import { PageRef } from "../../token";
import { JournalCalendar } from "./Calendar";
import { RecentPages } from "./RecentPages";
import { ReflectToMarkdown } from "./ReflectToMarkdown";
import { usePageNavigation } from "../../navigation";
import { usePageTitles } from "@/client/usePageTitles";

export function SideBar({
  pageTitle,
  pathname,
}: {
  pageTitle: string;
  pathname: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <>
      {!isSidebarOpen ? (
        <button
          type="button"
          className="
            fixed right-4 top-20
            z-20 rounded-full border border-primary/30
            bg-background hover:bg-primary/5
            px-4 py-2
            text-sm text-title shadow-xl shadow-black/10
          "
          aria-label="Show sidebar"
          onClick={() => setIsSidebarOpen(true)}
        >
          Sidebar
        </button>
      ) : null}
      {isSidebarOpen ? (
        <aside className="fixed right-4 top-20 z-20 w-[min(24rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="rounded-xl border border-primary/50 bg-background shadow-xl shadow-black/10">
            <div
              className="
                w-full
                p-6
                bg-background
              "
            >
              <SideBarHeader onClose={() => setIsSidebarOpen(false)} />
              <SideBarSections pageTitle={pageTitle} pathname={pathname} />
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function SideBarHeader({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <button
        type="button"
        className="
          rounded-md border border-primary/30
          px-3 py-1
          text-sm text-title
          hover:bg-primary/5
        "
        aria-label="Close sidebar"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

function SideBarSections({
  pageTitle,
  pathname,
}: {
  pageTitle: string;
  pathname: string;
}): JSX.Element {
  return (
    <>
      <SideBarElement title="🔍 Search">
        <SearchBox />
      </SideBarElement>
      <SideBarElement title="📅 Journals">
        <>
          <RecentJournal />
          <JournalCalendar pathname={pathname} />
        </>
      </SideBarElement>
      <SideBarElement title="⭐ Favorite Pages">
        <Favorites />
      </SideBarElement>
      <SideBarElement title="⌚ Recent">
        <RecentPages pageTitle={pageTitle} />
      </SideBarElement>
      <SideBarElement title="🔄 Update">
        <ReflectToMarkdown pageTitle={pageTitle} />
      </SideBarElement>
    </>
  );
}

function SideBarElement({
  title,
  children,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
}): JSX.Element {
  return (
    <div>
      <div className="opacity-50 px-1 mt-5">{title}</div>
      <div className="ml-10">{children}</div>
    </div>
  );
}

function SearchBox(): JSX.Element {
  const files = usePageTitles() || [];
  const { navigateToPage } = usePageNavigation();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const title = (e.target as HTMLInputElement).value;
      navigateToPage(`/pages/${encodeURIComponent(title)}`);
    }
  };

  return (
    <div>
      <input
        id="page-search"
        type="text"
        placeholder="page title"
        list="pagenames"
        onKeyDown={onKeyDown}
      />
      <datalist id="pagenames">
        {files?.map((file) => (
          <option key={file} value={file} />
        ))}
      </datalist>
    </div>
  );
}

function Favorites() {
  const favorites = useSidebarFavorites();

  const listElement = favorites?.map((favorite) => {
    return (
      <div key={favorite}>
        📓 <PageRef pageref={new PageRefEntity(favorite)} />
      </div>
    );
  });
  return <div>{listElement}</div>;
}

function RecentJournal() {
  const todayStr = new StadenDate().format();
  return <PageRef pageref={new PageRefEntity(todayStr)} />;
}

function useSidebarFavorites(): string[] | undefined {
  const [favorites, setFavorites] = useState<string[]>();

  useAbortableEffect((signal) => {
    systemRpc
      .configs({ signal })
      .then((configs) => {
        setFavorites(configs.favorites);
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        logError("Failed to load favorites", error);
      });
  }, []);

  return favorites;
}

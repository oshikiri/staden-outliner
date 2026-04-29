import { JSX, useState } from "react";

import { PageRef as PageRefEntity } from "@/shared/markdown/token";
import { StadenDate } from "@/shared/date";
import { systemRpc } from "@/client/rpc/system";
import { PageRef } from "../../token";
import { JournalCalendar } from "./Calendar";
import { RecentPages } from "./RecentPages";
import { ReloadButton } from "./ReloadButton";
import { ReflectToMarkdown } from "./ReflectToMarkdown";
import { usePageNavigation } from "../../navigation";
import { logError } from "@/shared/logger";
import { isAbortError } from "@/client/request";
import { useAbortableEffect } from "@/client/useAbortableEffect";

export function SideBar({
  pageTitle,
  pathname,
}: {
  pageTitle: string;
  pathname: string;
}) {
  return (
    <div
      className="
        w-full
        p-6
        bg-background
        rounded-xl
        border border-primary/50
      "
    >
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
        <ReloadButton />
        <ReflectToMarkdown pageTitle={pageTitle} />
      </SideBarElement>
    </div>
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
  const files = useSidebarFiles();
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

function useSidebarFiles(): string[] | undefined {
  const [files, setFiles] = useState<string[]>();

  useAbortableEffect((signal) => {
    systemRpc
      .files(undefined, { signal })
      .then((nextFiles) => {
        const titles = nextFiles.map((file: { title: string }) => file.title);
        setFiles(new Array(...new Set(titles)).sort());
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        logError("Failed to load sidebar files", error);
      });
  }, []);

  return files;
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

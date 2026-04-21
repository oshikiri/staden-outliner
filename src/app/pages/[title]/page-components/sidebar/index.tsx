import { JSX, useEffect, useState } from "react";

import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";
import { StadenDate } from "@/app/lib/date";
import { systemRpc } from "@/app/api/rpc/system";
import { PageRef } from "../../token";
import { JournalCalender } from "./Calender";
import { RecentPages } from "./RecentPages";
import { ReloadButton } from "./ReloadButton";
import { ReflectToMarkdown } from "./ReflectToMarkdown";
import { usePageNavigation } from "../../navigation";
import { logError } from "@/app/lib/logger";

// eslint-disable-next-line max-lines-per-function
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
        hidden lg:block
        lg:fixed lg:top-20 lg:right-0
        lg:m-2 lg:p-6
        lg:w-96
        lg:z-10
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
          <JournalCalender pathname={pathname} />
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
  const [files, setFiles] = useState<string[]>();
  const { navigateToPage } = usePageNavigation();

  useEffect(() => {
    systemRpc
      .files()
      .then((files) => {
        const titles = files.map((file: { title: string }) => file.title);
        setFiles(new Array(...new Set(titles)).sort());
      })
      .catch((error) => {
        logError("Failed to load sidebar files", error);
      });
  }, []);

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
  const [favorites, setFavorites] = useState<string[]>();

  useEffect(() => {
    systemRpc
      .configs()
      .then((configs) => setFavorites(configs.favorites))
      .catch((error) => {
        logError("Failed to load favorites", error);
      });
  }, []);

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

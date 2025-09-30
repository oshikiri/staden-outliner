import { JSX, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";
import { StadenDate } from "@/app/lib/date";
import { PageRef } from "../../token";
import { JournalCalender } from "./Calender";
import { RecentPages } from "./RecentPages";
import { ReloadButton } from "./ReloadButton";
import { ReflectToMarkdown } from "./ReflectToMarkdown";
import { getAllFiles, getAllConfigs } from "./api";

export function SideBar({ pageTitle }: { pageTitle: string }) {
  return (
    <div
      // @agent 固定サイドバーは小画面でコンテンツと競合しがちです。Tailwind のレスポンシブユーティリティ（例: `hidden lg:block`）で表示制御を検討してください。
      className="
        fixed top-20 right-0
        m-2 p-6
        w-96
        z-10
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
          <JournalCalender pathname={usePathname()} />
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
  const router = useRouter();

  useEffect(() => {
    getAllFiles().then((files) => {
      const titles = files.map((file: { title: string }) => file.title);
      setFiles(new Array(...new Set(titles)).sort());
    });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const title = (e.target as HTMLInputElement).value;
      router.push(`/pages/${encodeURIComponent(title)}`);
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
    getAllConfigs().then((configs) => setFavorites(configs.favorites));
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

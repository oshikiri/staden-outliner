import { JSX, useEffect, useState } from "react";

import {
  Block as BlockEntity,
  create as createBlock,
} from "@/app/lib/markdown/block";
import { PageRef } from "@/app/lib/markdown/token";
import { Token } from "../token";
import Block from "../block";

export function BacklinksContainer({
  pageId,
}: {
  pageId: string | undefined;
}): JSX.Element {
  const [backlinks, setBacklinks] = useState<BlockEntity[]>([]);
  useEffect(() => {
    if (!pageId) {
      return;
    }
    getPageBacklinks(pageId).then((backlinks) => {
      if (!backlinks) {
        return;
      }
      console.log("getPageBacklinks", backlinks);
      setBacklinks(backlinks);
    });
  }, [pageId]);

  return (
    <div className="mt-20 break-all">
      <div className="text-xl">{backlinks?.length || 0} Linked References</div>
      <div>
        {backlinks
          .sort(compareFnForBacklink)
          .map((sourceBlock: BlockEntity, key: number) => {
            return (
              <BacklinkPage
                name={(sourceBlock.getProperty("title") as string) || ""}
                block={sourceBlock}
                key={`${sourceBlock.id}-${key}`}
              />
            );
          })}
      </div>
    </div>
  );
}

async function getPageBacklinks(pageId: string): Promise<BlockEntity[] | null> {
  const response = await fetch(`/api/pages/${pageId}/backlinks`, {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  return json.map((block: BlockEntity) => createBlock(block));
}

function BacklinkPage({
  name,
  block,
}: {
  name: string;
  block: BlockEntity;
}): JSX.Element {
  const pageRef = new PageRef(name || "");
  return (
    <div className="m-2 p-5 bg-primary/5 rounded-xl border border-primary/50">
      <div className="mb-2">
        <Token token={pageRef} />
      </div>
      <div className="text-sm text-primary/50 pl-5">
        {block.getProperty("ancestors") as string}
      </div>
      <Block block={block} editable={false} />
    </div>
  );
}

function compareFnForBacklink(l: BlockEntity, r: BlockEntity): number {
  function isJournal(title: string): boolean {
    return title.match(/^\d{4}-\d{2}-\d{2}/) !== null;
  }
  const lIsJournal = isJournal(l.getProperty("title") as string);
  const rIsJournal = isJournal(r.getProperty("title") as string);
  if (lIsJournal && !rIsJournal) {
    return -1;
  }
  if (!lIsJournal && rIsJournal) {
    return 1;
  }
  const lTitle = (l.getProperty("title") as string) || "";
  const rTitle = (r.getProperty("title") as string) || "";
  if (lTitle < rTitle) {
    return 1;
  }
  if (lTitle > rTitle) {
    return -1;
  }
  return 0;
}

import { JSX, useState } from "react";

import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { pageRpc } from "@/app/api/rpc/page";
import { PageRef } from "@/app/lib/markdown/token";
import { Token } from "../token";
import Block from "../block";
import { logDebug, logError } from "@/app/lib/logger";
import { isAbortError } from "@/app/lib/client/request";
import { useAbortableEffect } from "@/app/lib/client/useAbortableEffect";

export function BacklinksContainer({
  pageTitle,
}: {
  pageTitle: string | undefined;
}): JSX.Element {
  const backlinks = useBacklinks(pageTitle);

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

function useBacklinks(pageTitle: string | undefined): BlockEntity[] {
  const [backlinks, setBacklinks] = useState<BlockEntity[]>([]);

  useAbortableEffect(
    (signal) => {
      if (!pageTitle) {
        setBacklinks([]);
        return;
      }

      pageRpc
        .backlinks(pageTitle, { signal })
        .then((nextBacklinks) => {
          logDebug("getPageBacklinks", { count: nextBacklinks.length });
          setBacklinks(nextBacklinks);
        })
        .catch((error) => {
          if (isAbortError(error)) {
            return;
          }
          logError("Failed to load backlinks", error);
        });
    },
    [pageTitle],
  );

  return backlinks;
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

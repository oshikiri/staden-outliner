import { JSX, useState } from "react";

import { Block as BlockEntity } from "@/shared/markdown/block";
import { pageRpc } from "@/client/rpc/page";
import { PageRef } from "@/shared/markdown/token";
import { Token } from "../token";
import Block from "../block";
import { logDebug, logError } from "@/shared/logger";
import { isAbortError } from "@/client/request";
import { useAbortableEffect } from "@/client/useAbortableEffect";
import { sortBacklinks } from "@/shared/backlink";
import { getErrorMessage } from "@/client/error";
import { RpcErrorMessage } from "./RpcErrorMessage";

type BacklinksState = {
  status: "loading" | "ready" | "error";
  backlinks: BlockEntity[];
  errorMessage: string | null;
};

export function BacklinksContainer({
  pageTitle,
}: {
  pageTitle: string | undefined;
}): JSX.Element {
  const backlinksState = useBacklinks(pageTitle);
  const backlinksCount =
    backlinksState.status === "ready" ? backlinksState.backlinks.length : 0;
  const heading =
    backlinksState.status === "loading"
      ? "Loading Linked References..."
      : backlinksState.status === "error"
        ? "Linked References"
        : `${backlinksCount} Linked References`;

  return (
    <div className="mt-20 break-all">
      <div className="text-xl">{heading}</div>
      {backlinksState.status === "error" ? (
        <RpcErrorMessage
          title="Failed to load backlinks"
          message={backlinksState.errorMessage || "Unknown error"}
        />
      ) : null}
      <div>
        {backlinksState.status === "ready"
          ? sortBacklinks(backlinksState.backlinks).map(
              (sourceBlock: BlockEntity, key: number) => {
                return (
                  <BacklinkPage
                    name={(sourceBlock.getProperty("title") as string) || ""}
                    block={sourceBlock}
                    key={`${sourceBlock.id}-${key}`}
                  />
                );
              },
            )
          : null}
      </div>
    </div>
  );
}

function useBacklinks(pageTitle: string | undefined): BacklinksState {
  const [backlinksState, setBacklinksState] = useState<BacklinksState>({
    status: "loading",
    backlinks: [],
    errorMessage: null,
  });

  useAbortableEffect(
    (signal) => {
      if (!pageTitle) {
        setBacklinksState({
          status: "ready",
          backlinks: [],
          errorMessage: null,
        });
        return;
      }

      setBacklinksState({
        status: "loading",
        backlinks: [],
        errorMessage: null,
      });

      pageRpc
        .backlinks(pageTitle, { signal })
        .then((nextBacklinks) => {
          logDebug("getPageBacklinks", { count: nextBacklinks.length });
          setBacklinksState({
            status: "ready",
            backlinks: nextBacklinks,
            errorMessage: null,
          });
        })
        .catch((error) => {
          if (isAbortError(error)) {
            return;
          }
          logError("Failed to load backlinks", error);
          setBacklinksState({
            status: "error",
            backlinks: [],
            errorMessage: getErrorMessage(error, "Failed to load backlinks"),
          });
        });
    },
    [pageTitle],
  );

  return backlinksState;
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

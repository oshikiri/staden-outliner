import { JSX, MouseEventHandler, useState } from "react";

import {
  applyContentMarkdown,
  Block as BlockEntity,
  getContentMarkdown,
} from "@/shared/markdown/block";
import { getErrorMessage } from "@/client/error";
import { pageRpc } from "@/client/rpc/page";
import { flipCollapsed } from "@/shared/markdown/utils";
import { logError, logDebug } from "@/shared/logger";
import { useStore } from "../state";
import { RpcErrorMessage } from "../page-components/RpcErrorMessage";

export function Bullet({ block }: { block: BlockEntity }): JSX.Element {
  const page = useStore((state) => state.page) || new BlockEntity([], 0, []);
  const setPage = useStore((state) => state.setPage);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const collapsedStr: string = block.getProperty("collapsed") as string;
  const collapsed = collapsedStr?.trim() === "true";

  const onClick: MouseEventHandler = (event) => {
    event?.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    const target = page.getBlockById(block.id || "");
    if (!target) {
      logError("Block not found");
      setIsLoading(false);
      setErrorMessage("Block not found");
      return;
    }
    const contentMarkdown = getContentMarkdown(target);
    logDebug("Bullet onClick", { blockId: target.id });
    applyContentMarkdown(target, flipCollapsed(contentMarkdown));
    void pageRpc
      .update(page)
      .then((nextPage) => {
        setPage(nextPage);
        setErrorMessage(null);
        setIsLoading(false);
      })
      .catch((error) => {
        logError("Failed to update collapsed state", error);
        setIsLoading(false);
        setErrorMessage(
          getErrorMessage(error, "Failed to update collapsed state"),
        );
      });
  };
  return (
    <div>
      <button
        type="button"
        className="
          data-[collapsed=true]:bg-primary/30
          inline-block
          border-0
          p-0
          m-1
          w-4 h-4
          rounded-full
          cursor-pointer
          disabled:cursor-wait
        "
        disabled={isLoading}
        onClick={onClick}
        data-collapsed={collapsed || undefined}
      >
        <div className="bg-primary m-1 w-2 h-2 rounded-full"></div>
      </button>
      {errorMessage ? (
        <RpcErrorMessage
          title="Failed to update collapsed state"
          message={errorMessage}
        />
      ) : null}
    </div>
  );
}

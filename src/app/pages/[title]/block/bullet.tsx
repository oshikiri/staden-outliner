import { JSX, MouseEventHandler } from "react";

import {
  applyContentMarkdown,
  Block as BlockEntity,
  getContentMarkdown,
} from "@/shared/markdown/block";
import { pageRpc } from "@/app/api/rpc/page";
import { flipCollapsed } from "@/shared/markdown/utils";
import { useStore } from "../state";
import { logError, logDebug } from "@/shared/logger";

export function Bullet({ block }: { block: BlockEntity }): JSX.Element {
  const page = useStore((state) => state.page) || new BlockEntity([], 0, []);
  const setPage = useStore((state) => state.setPage);

  const collapsedStr: string = block.getProperty("collapsed") as string;
  const collapsed = collapsedStr?.trim() === "true";

  const onClick: MouseEventHandler = async (event) => {
    event?.preventDefault();
    const target = page.getBlockById(block.id || "");
    if (!target) {
      logError("Block not found");
      return;
    }
    const contentMarkdown = getContentMarkdown(target);
    logDebug("Bullet onClick", { blockId: target.id });
    applyContentMarkdown(target, flipCollapsed(contentMarkdown));

    pageRpc.update(page).then(setPage);
  };
  return (
    <div
      className="
        data-[collapsed=true]:bg-primary/30
        inline-block
        m-1
        w-4 h-4
        rounded-full
      "
      onClick={onClick}
      data-collapsed={collapsed || undefined}
    >
      <div className="bg-primary m-1 w-2 h-2 rounded-full"></div>
    </div>
  );
}

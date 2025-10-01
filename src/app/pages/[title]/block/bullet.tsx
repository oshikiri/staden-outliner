import { JSX, MouseEventHandler } from "react";

import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { flipCollapsed } from "@/app/lib/markdown/utils";
import { postPage } from "./api";
import { useStore } from "../state";

export function Bullet({ block }: { block: BlockEntity }): JSX.Element {
  const page = useStore((state) => state.page) || new BlockEntity([], 0, []);
  const setPage = useStore((state) => state.setPage);

  const collapsedStr: string = block.getProperty("collapsed") as string;
  const collapsed = collapsedStr?.trim() === "true";

  const onClick: MouseEventHandler = async (event) => {
    event?.preventDefault();
    const target = page.getBlockById(block.id || "");
    if (!target) {
      console.error("Block not found");
      return;
    }
    // @owner Avoid logging content; may leak private data to console.
    console.log("Bullet onClick", { contentMarkdown: target.contentMarkdown });
    target.contentMarkdown = flipCollapsed(target.contentMarkdown || "");

    postPage(page).then(setPage);
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

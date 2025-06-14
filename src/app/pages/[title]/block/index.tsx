import { JSX } from "react";

import {
  Block as BlockEntity,
  create as createBlock,
} from "@/app/lib/markdown/block";
import { Bullet } from "./bullet";
import { Content } from "./content";

export default function Block({
  block,
  editable = true,
}: {
  block: BlockEntity;
  editable?: boolean;
}): JSX.Element {
  block = createBlock(block);
  return (
    <div
      className="
        ml-2 flex list-none
        data-[status=DONE]:opacity-30
      "
      key={block.id}
      data-status={block.getProperty("status")}
    >
      <Bullet block={block} />
      <div className="w-full">
        <Content block={block} editable={editable} />
        <Children block={block} />
      </div>
    </div>
  );
}

function Children({ block }: { block: BlockEntity }): JSX.Element {
  const collapsedStr: string = block.getProperty("collapsed") as string;
  const collapsed = collapsedStr?.trim() === "true";

  if (!block.children || block.children.length === 0) {
    return <></>;
  }

  return (
    <div
      key={"children" + block.id || ""}
      className={collapsed ? "hidden" : ""}
    >
      {block.children?.map((child: BlockEntity) => {
        return <Block block={child} key={child.id}></Block>;
      })}
    </div>
  );
}

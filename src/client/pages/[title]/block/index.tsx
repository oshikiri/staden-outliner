import { JSX, useMemo } from "react";

import {
  Block as BlockEntity,
  create as createBlock,
} from "@/shared/markdown/block";
import { Bullet } from "./bullet";
import { Content } from "./content";

export default function Block({
  block,
  editable = true,
}: {
  block: BlockEntity;
  editable?: boolean;
}): JSX.Element {
  // `createBlock` clones the whole subtree, so avoid repeating it on every render.
  const clonedBlock = useMemo(() => createBlock(block), [block]);
  return (
    <div
      className="
        ml-2 flex
        data-[status=DONE]:opacity-30
      "
      key={clonedBlock.id}
      data-status={clonedBlock.getProperty("status")}
    >
      <Bullet block={clonedBlock} />
      <div className="w-full">
        <Content block={clonedBlock} editable={editable} />
        <Children block={clonedBlock} />
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

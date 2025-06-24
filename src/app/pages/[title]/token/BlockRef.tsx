import { JSX } from "react";
import { Token } from ".";
import { BlockRef as BlockRefEntity } from "@/app/lib/markdown/token";

export function BlockRef({ token }: { token: BlockRefEntity }): JSX.Element {
  return (
    <div className="p-2 m-1 border-l-2 border-red-500">
      {token.resolvedContent?.map((c, i) => (
        <Token key={i} token={c} />
      ))}
    </div>
  );
}

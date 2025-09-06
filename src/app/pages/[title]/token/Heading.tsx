import { JSX } from "react";
import { Token } from ".";
import { Heading as HeadingEntity } from "@/app/lib/markdown/token";

export function Heading({ token }: { token: HeadingEntity }): JSX.Element {
  return (
    <div
      className="text-xl text-title w-full border-b pt-2"
      data-level={token.level}
    >
      {/* RV: Rendering literal '#' duplicates semantic heading level; consider using semantic <h1>-<h6> or aria roles. */}
      {"#".repeat(token.level)}{" "}
      {token.content?.map((c, i) => (
        <Token key={i} token={c} />
      ))}
    </div>
  );
}

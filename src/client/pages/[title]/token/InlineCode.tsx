import { JSX } from "react";
import { InlineCode as InlineCodeEntity } from "@/shared/markdown/token";

export function InlineCode({
  token,
}: {
  token: InlineCodeEntity;
}): JSX.Element {
  return (
    <code
      className="
       bg-primary/5
       px-1.5 py-1
       rounded-sm
      "
    >
      {token.textContent}
    </code>
  );
}

import { JSX } from "react";

import { Quote as QuoteEntity } from "@/app/lib/markdown/token";
import { Token } from ".";

export function Quote({ token }: { token: QuoteEntity }): JSX.Element {
  return (
    <blockquote
      className="
        bg-blockquote
        border-l-4 border-line
        mx-1 my-2
        px-2 py-2
      "
    >
      {token.tokens.map((t, key: number) => (
        <Token key={key} token={t} />
      ))}
    </blockquote>
  );
}

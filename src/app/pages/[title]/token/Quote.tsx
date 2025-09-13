import { JSX } from "react";

import { Quote as QuoteEntity } from "@/app/lib/markdown/token";
import { Token } from ".";

export function Quote({ token }: { token: QuoteEntity }): JSX.Element {
  return (
    <blockquote
      // RV: `border-l-3` はデフォルトに無い幅指定です。`border-l-[3px]` の任意値を使用するか、テーマに 3px を追加してください。
      // RV: `border-l-line` は無効です。色は `border-line` で指定し、左辺の幅は `border-l-*` で設定します。
      className="
      bg-blockquote
      border-l-3 border-line
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

import { JSX } from "react";
import { Token } from ".";
import { Command as CommandEntity } from "@/app/lib/markdown/token";

export function Command({ token }: { token: CommandEntity }): JSX.Element {
  if (token.name === "embed") {
    return (
      // RV: `embed` は Tailwind のクラスではありません。グローバル CSS がなければ削除するか、Tailwind ユーティリティへ置き換えてください。
      <div className="embed">
        {token.resolvedContent?.map((c, i) => (
          <Token key={i} token={c} />
        ))}
      </div>
    );
  }
  return <></>;
}

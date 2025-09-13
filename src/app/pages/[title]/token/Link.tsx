import NextLink from "next/link";
import { JSX } from "react";
import { Link as LinkEntity } from "@/app/lib/markdown/token";

export function Link({ token }: { token: LinkEntity }): JSX.Element {
  const url = token.url;

  if (!url.startsWith("http")) {
    return <span>{url}</span>;
  }

  return (
    <NextLink
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      // RV: `break-all` は英単語を強制分割します。可読性重視なら `break-words`/`break-normal` も検討してください。
      className="text-link break-all"
    >
      {token.title}
    </NextLink>
  );
}

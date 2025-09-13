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
      // Split forcibly because the link text may be url
      className="text-link break-all"
    >
      {token.title}
    </NextLink>
  );
}

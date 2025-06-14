import NextLink from "next/link";
import { JSX } from "react";
import { Link as LinkEntity } from "@/app/lib/markdown/token";

export function Link({ token }: { token: LinkEntity }): JSX.Element {
  return (
    <NextLink
      href={token.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="text-link break-all"
    >
      {token.title}
    </NextLink>
  );
}

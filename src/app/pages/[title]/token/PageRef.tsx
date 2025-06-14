import NextLink from "next/link";

import { PageRef as PageRefEntity } from "@/app/lib/markdown/token";

export function PageRef({ pageref }: { pageref: PageRefEntity }) {
  return (
    <span>
      <span className="opacity-50">[[</span>
      <NextLink
        className="text-link no-underline"
        href={`/pages/${encodeURIComponent(pageref.title)}`}
        onClick={(event) => event.stopPropagation()}
      >
        {pageref.title}
      </NextLink>
      <span className="opacity-50">]]</span>
    </span>
  );
}

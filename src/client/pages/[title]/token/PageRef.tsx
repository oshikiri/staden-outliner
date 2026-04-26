import { PageRef as PageRefEntity } from "@/shared/markdown/token";
import { usePageNavigation } from "../navigation";

export function PageRef({ pageref }: { pageref: PageRefEntity }) {
  const { navigateToPage } = usePageNavigation();
  const href = `/pages/${encodeURIComponent(pageref.title)}`;
  return (
    <span>
      <span className="opacity-50">[[</span>
      <a
        className="text-link no-underline"
        href={href}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          navigateToPage(href);
        }}
      >
        {pageref.title}
      </a>
      <span className="opacity-50">]]</span>
    </span>
  );
}

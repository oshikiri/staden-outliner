import { JSX } from "react";
import { apiFetch } from "@/app/lib/client/api";
import {
  expectEmptyJsonResponse,
  pageUpdateMarkdownRoutePath,
} from "@/app/api/contracts";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = () => {
    // @owner No error handling or user feedback on failure.
    void apiFetch(pageUpdateMarkdownRoutePath(pageTitle), {
      method: "POST",
    })
      .then(expectEmptyJsonResponse)
      .catch(() => undefined);
  };

  return (
    <div className="underline" onClick={onClick}>
      Reflect to markdown
    </div>
  );
}

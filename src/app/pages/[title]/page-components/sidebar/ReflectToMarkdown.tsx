import { JSX } from "react";
import { apiFetch } from "@/app/lib/client/api";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = async () => {
    // @owner No error handling or user feedback on failure.
    apiFetch(`/api/pages/${pageTitle}/update_markdown`, {
      method: "POST",
    });
  };

  return (
    <div className="underline" onClick={onClick}>
      Reflect to markdown
    </div>
  );
}

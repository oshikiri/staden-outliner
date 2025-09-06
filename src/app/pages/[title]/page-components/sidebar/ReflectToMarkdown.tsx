import { JSX } from "react";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = async () => {
    // RV: Mutating state via GET breaks REST semantics; use POST.
    // RV: No error handling or user feedback on failure.
    fetch(`/api/pages/${pageTitle}/update_markdown`, {
      method: "GET",
    });
  };

  return (
    <div className="underline" onClick={onClick}>
      Reflect to markdown
    </div>
  );
}

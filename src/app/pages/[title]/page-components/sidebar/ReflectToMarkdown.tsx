import { JSX } from "react";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = async () => {
    // @owner No error handling or user feedback on failure.
    fetch(`/api/pages/${pageTitle}/update_markdown`, {
      method: "POST",
    });
  };

  return (
    <div className="underline" onClick={onClick}>
      Reflect to markdown
    </div>
  );
}

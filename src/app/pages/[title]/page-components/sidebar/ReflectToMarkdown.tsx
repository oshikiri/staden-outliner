import { JSX } from "react";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = async () => {
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

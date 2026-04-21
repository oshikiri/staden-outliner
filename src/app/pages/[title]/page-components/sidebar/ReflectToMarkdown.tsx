import { JSX } from "react";
import { pageRpc } from "@/app/api/rpc/page";
export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const onClick = () => {
    void pageRpc.reflectMarkdown(pageTitle).catch(() => undefined);
  };

  return (
    <div className="underline" onClick={onClick}>
      Reflect to markdown
    </div>
  );
}

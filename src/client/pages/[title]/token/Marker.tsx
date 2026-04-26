import { JSX } from "react";

export function Marker({
  status,
}: {
  status: string | undefined;
}): JSX.Element | null {
  if (!status) {
    return null;
  }
  const content = getContent(status);
  return (
    <div
      className="
        px-1 mr-1
        inline-block
        text-primary/40 bg-primary/10
      "
    >
      {content}
    </div>
  );
}

function getContent(status: string): JSX.Element {
  switch (status) {
    case "DONE":
      return <div className="w-4">✓</div>;
    case "DOING":
      return <div className="w-4">↻</div>;
    default:
      return <div>{status}</div>;
  }
}

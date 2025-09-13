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
      // RV: `align-center` / `vertical-align-top` は Tailwind のユーティリティに存在しません。垂直整列は `align-top`、中央寄せはレイアウト次第で `items-center`（flex）や `text-center` を使用してください。
      // RV: `m-1/2` は無効です。`m-0.5`（0.125rem）などのスケール、もしくは任意値 `m-[2px]` を使用してください。
      className="
      px-1 py-0 mr-1
      align-center vertical-align-top
      inline-block
      text-primary/40
      bg-primary/10
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
      // RV: `m-1/2` は Tailwind のスペーシングスケールにありません。`m-0.5` もしくは任意値 `m-[2px]` を使用してください。
      return <div className="m-1/2">{status}</div>;
  }
}

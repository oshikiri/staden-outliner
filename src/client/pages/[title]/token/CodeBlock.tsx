import { JSX } from "react";

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}): JSX.Element {
  return (
    <div className="relative w-full block py-2">
      <span
        className="
          text-xs
          absolute top-0 right-0
          px-2 py-1
          rounded-sm
          bg-primary/10
        "
      >
        {language}
      </span>
      <pre
        className="
          text-xs
          w-full
          border-l-4 border-line
          px-4 py-2
          whitespace-pre-wrap
        "
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

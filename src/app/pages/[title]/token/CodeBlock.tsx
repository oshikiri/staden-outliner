import { JSX } from "react";

import highlight from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}): JSX.Element {
  let languageForHighlight = language;
  if (!highlight.listLanguages().includes(language)) {
    languageForHighlight = "plaintext";
  }
  const html = highlight.highlight(code, {
    language: languageForHighlight,
  }).value;
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
        // @owner Rendering untrusted HTML via dangerouslySetInnerHTML can enable XSS. Sanitize or trust only server-escaped output.
        dangerouslySetInnerHTML={{ __html: html }}
      ></pre>
    </div>
  );
}

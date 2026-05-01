import { JSX, useEffect } from "react";

import { usePageTitles } from "@/client/usePageTitles";

export function Suggestion({
  suggestionQuery,
  setSuggestionQuery,
  contentMarkdown,
  setup,
  teardown,
}: {
  suggestionQuery?: string;
  setSuggestionQuery: (suggestionQuery: string | undefined) => void;
  contentMarkdown: string;
  setup: () => void;
  teardown: (contentMarkdown: string) => void;
}): JSX.Element {
  useEffect(() => {
    if (suggestionQuery == undefined) {
      return;
    }
    setup();
  }, [setup, suggestionQuery]);

  if (suggestionQuery == undefined) {
    return <></>;
  }
  return (
    <div>
      <input
        type="text"
        placeholder="page name"
        autoFocus
        className="text-gray-500"
        list="suggestions"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setSuggestionQuery(undefined);
            const nextContent =
              contentMarkdown + (`[[${suggestionQuery}]]` || "");
            teardown(nextContent);
          }
        }}
        onChange={(e) => {
          setSuggestionQuery(e.target.value);
        }}
      />
      <Candidates query={suggestionQuery} />
    </div>
  );
}

function Candidates({ query }: { query: string }): JSX.Element {
  const values = usePageTitles() || [];
  return (
    <datalist id="suggestions">
      {values
        .filter((v: string) => v.startsWith(query))
        .map((value) => (
          <option key={value} value={value} />
        ))}
    </datalist>
  );
}

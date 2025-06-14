import { JSX } from "react";

import { File } from "@/app/lib/file";

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
  if (suggestionQuery == undefined) {
    return <></>;
  }
  setup();
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

let files: string[] = [];
async function cacheFiles() {
  getAllFiles().then((f) => {
    files = f.map((file: { title: string }) => file.title);
    localStorage.setItem("files", JSON.stringify(files));
  });
}
if (typeof localStorage !== "undefined") {
  cacheFiles();
}

function Candidates({ query }: { query: string }): JSX.Element {
  const cachedFiles = localStorage.getItem("files");
  const values: string[] = cachedFiles ? JSON.parse(cachedFiles) : [];
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

async function getAllFiles(): Promise<File[]> {
  const response = await fetch("/api/files", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  const json = await response.json();
  return json;
}

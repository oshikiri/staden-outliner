import { JSX } from "react";

import type { File } from "@/app/lib/file";
import { apiFetch } from "@/app/lib/client/api";

// eslint-disable-next-line max-lines-per-function
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
  getAllFiles()
    .then((f) => {
      files = f.map((file: { title: string }) => file.title);
      localStorage.setItem("files", JSON.stringify(files));
    })
    .catch((error) => {
      console.error("Failed to cache files", error);
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
  const response = await apiFetch("/api/files", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  if (!response.ok) {
    throw new Error(`Failed to load files: ${response.status}`);
  }
  const text = await response.text();
  if (text.trim() === "") {
    throw new Error("Empty JSON response");
  }
  try {
    return JSON.parse(text) as File[];
  } catch {
    throw new Error("Invalid JSON response");
  }
}

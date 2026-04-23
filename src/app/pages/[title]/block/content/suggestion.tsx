import { JSX, useEffect, useState } from "react";

import { systemRpc } from "@/app/api/rpc/system";
import { logError } from "@/shared/logger";
import { isAbortError } from "@/app/lib/client/request";

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

function useCachedFiles(): string[] {
  const [files, setFiles] = useState<string[]>(() => {
    if (typeof localStorage === "undefined") {
      return [];
    }
    const cachedFiles = localStorage.getItem("files");
    return cachedFiles ? JSON.parse(cachedFiles) : [];
  });

  useEffect(() => {
    const controller = new AbortController();

    systemRpc
      .files(undefined, { signal: controller.signal })
      .then((f) => {
        if (controller.signal.aborted) {
          return;
        }
        const nextFiles = f.map((file: { title: string }) => file.title);
        setFiles(nextFiles);
        localStorage.setItem("files", JSON.stringify(nextFiles));
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        logError("Failed to cache files", error);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return files;
}

function Candidates({ query }: { query: string }): JSX.Element {
  const values = useCachedFiles();
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

import { JSX, useRef, useEffect } from "react";
import { QueryTable } from "./QueryTable";
import { CommandQuery as CommandQueryEntity } from "@/shared/markdown/token";

export function CommandQuery({
  token,
}: {
  token: CommandQueryEntity;
}): JSX.Element {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-sm text-primary/50 whitespace-nowrap">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs tracking-wide">
          CommandQuery
        </span>
        <span>
          {token.resolvedBlocks?.length || 0} results, execution time:{" "}
          {token.queryExecutionMilliseconds || "?"} ms
        </span>
      </div>
      {token.vlJsonStr && (
        <VegaLiteEmbed
          vlJsonStr={token.vlJsonStr}
          data={token.resolvedDataForVlJson || []}
        />
      )}
      <QueryTable data={token.resolvedBlocks || []} />
    </div>
  );
}

function VegaLiteEmbed({
  vlJsonStr,
  data,
}: {
  vlJsonStr: string;
  data: unknown[];
}): JSX.Element {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!element.current) return;
    const vlJson = {
      ...JSON.parse(vlJsonStr),
      data: {
        values: data,
      },
    };
    element.current.appendChild(
      document
        .createRange()
        .createContextualFragment(
          `<script>vegaEmbed("#vis", ${JSON.stringify(vlJson)}, {actions: false})</script>`,
        ),
    );
  }, [element, vlJsonStr, data]);

  return (
    <div ref={element} onClick={(e) => e.stopPropagation()}>
      <div id="vis"></div>
    </div>
  );
}

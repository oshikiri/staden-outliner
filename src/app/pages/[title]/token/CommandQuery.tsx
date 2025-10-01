import { JSX, useRef, useEffect } from "react";
import { QueryTable } from "./QueryTable";
import { CommandQuery as CommandQueryEntity } from "@/app/lib/markdown/token";

export function CommandQuery({
  token,
}: {
  token: CommandQueryEntity;
}): JSX.Element {
  return (
    <div>
      <div className="text-sm w-full text-right text-primary/50">
        {token.resolvedBlocks?.length || 0} results, execution time:{" "}
        {token.queryExecutionMilliseconds || "?"} ms
      </div>
      {token.query.includes("vegalite=on") && (
        <VegaLiteEmbed
          vlJsonStr={token.vlJsonStr || ""}
          data={token.resolvedDataForVlJson || []}
        />
      )}
      {!token.query.includes("table=off") && (
        <QueryTable data={token.resolvedBlocks || []} />
      )}
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
    // @owner Injecting a script tag built from `vlJsonStr` can be risky. Ensure `vlJsonStr` is validated/sanitized and avoid dynamic script injection when possible.
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

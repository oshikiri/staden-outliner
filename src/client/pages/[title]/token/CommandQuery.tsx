import { JSX, useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { logWarn } from "@/shared/logger";
import { QueryTable } from "./QueryTable";
import { CommandQuery as CommandQueryEntity } from "@/shared/markdown/token";

export function CommandQuery({
  token,
}: {
  token: CommandQueryEntity;
}): JSX.Element {
  const data = useMemo(
    () => token.resolvedBlocks ?? [],
    [token.resolvedBlocks],
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-sm text-primary/50 whitespace-nowrap">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs tracking-wide">
          CommandQuery
        </span>
        <span>
          {data.length} results, execution time:{" "}
          {token.queryExecutionMilliseconds || "?"} ms
        </span>
      </div>
      <CommandQueryChart chartSource={token.chartSource} data={data} />
      <QueryTable data={data} />
    </div>
  );
}

function CommandQueryChart({
  chartSource,
  data,
}: {
  chartSource?: string;
  data: Record<string, unknown>[];
}): JSX.Element {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = element.current;
    if (!container) return;

    container.replaceChildren();

    let plot: Element | null = null;
    try {
      plot = chartSource
        ? executeCommandQueryChartSource(chartSource, data)
        : null;

      if (plot) {
        container.append(plot);
      }
    } catch (error) {
      logWarn("Failed to render CommandQuery chart", error);
    }

    return () => {
      plot?.remove();
      container.replaceChildren();
    };
  }, [chartSource, data]);

  return (
    <div
      ref={element}
      className="overflow-x-auto"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function runCommandQueryChartSource(
  source: string,
  data: Record<string, unknown>[],
): unknown {
  return new Function("Plot", "data", "results", source)(Plot, data, data);
}

export function executeCommandQueryChartSource(
  source: string,
  data: Record<string, unknown>[],
): Element {
  const result = runCommandQueryChartSource(source, data);

  if (!(result instanceof Element)) {
    throw new Error("CommandQuery chart source must return a DOM element");
  }

  return result;
}

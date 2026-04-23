import { DependencyList, useEffect } from "react";

export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | (() => void),
  deps: DependencyList,
): void {
  useEffect(() => {
    const controller = new AbortController();
    const cleanup = effect(controller.signal);

    return () => {
      controller.abort();
      cleanup?.();
    };
  }, deps);
}

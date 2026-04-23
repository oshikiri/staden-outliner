import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { logWarn } from "@/shared/logger";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

void main();

async function main() {
  await ensureVegaScripts().catch((error) => {
    logWarn(
      "Vega scripts are unavailable; graph rendering is disabled.",
      error,
    );
  });

  createRoot(root as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

let vegaScriptsPromise: Promise<void> | undefined;

async function ensureVegaScripts(): Promise<void> {
  if (!vegaScriptsPromise) {
    vegaScriptsPromise = (async () => {
      await loadScript("/public/vega.js");
      await loadScript("/public/vega-lite.js");
      await loadScript("/public/vega-embed.js");
    })();
  }

  return vegaScriptsPromise;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => {
        existing.dataset.loaded = "true";
        resolve();
      });
      existing.addEventListener("error", () => {
        reject(new Error(`Failed to load ${src}`));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error(`Failed to load ${src}`));
    });
    document.head.appendChild(script);
  });
}

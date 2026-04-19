import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

void main();

async function main() {
  await ensureVegaScripts();

  createRoot(root).render(
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

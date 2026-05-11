import { access, cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { constants as fsConstants } from "node:fs";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { logError } from "@/shared/logger";

const distDir = join(process.cwd(), "dist");
const assetsDir = join(distDir, "assets");
const cssEntry = join(process.cwd(), "src/client/default-theme.css");
const indexHtmlEntry = join(process.cwd(), "src/server/index.html");

export async function buildWeb(): Promise<boolean> {
  await rm(assetsDir, { recursive: true, force: true });
  await rm(join(distDir, "public"), { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  const result = await buildBrowserBundle();

  if (!result.success) {
    logBuildFailure(result.logs);
    return false;
  }

  const mainCss = await buildCssContents();
  await writeFile(buildCss(), mainCss);
  await cp(indexHtmlEntry, join(distDir, "index.html"));
  await copyOptionalPublicAssets();
  return true;
}

async function main() {
  const success = await buildWeb();
  if (!success) {
    process.exitCode = 1;
  }
}

async function buildBrowserBundle() {
  return Bun.build({
    entrypoints: [join(process.cwd(), "src/client/main.tsx")],
    outdir: assetsDir,
    target: "browser",
    minify: true,
  });
}

function logBuildFailure(logs: ReadonlyArray<unknown>): void {
  logError("Bun.build() failed.");

  if (logs.length === 0) {
    logError("Bun.build() did not return any logs.");
    return;
  }

  for (const log of logs) {
    logError(log);
  }
}

function buildCss(): string {
  return join(assetsDir, "main.css");
}

async function buildCssContents(): Promise<string> {
  const input = await Bun.file(cssEntry).text();
  const result = await postcss([tailwindcss({ optimize: true })]).process(
    input,
    {
      from: cssEntry,
      to: join(assetsDir, "main.css"),
    },
  );
  return result.css;
}

async function copyOptionalPublicAssets(): Promise<void> {
  const publicDir = join(process.cwd(), "public");
  try {
    await access(publicDir, fsConstants.F_OK);
    if (!(await stat(publicDir)).isDirectory()) {
      return;
    }
    await cp(publicDir, join(distDir, "public"), {
      recursive: true,
    });
  } catch (error) {
    const cause = error as { code?: string };
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      cause.code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}

if (import.meta.main) {
  void main().catch((error) => {
    logError(error);
    process.exit(1);
  });
}

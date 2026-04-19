import { access, cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { constants as fsConstants } from "node:fs";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

const distDir = join(process.cwd(), "dist");
const assetsDir = join(distDir, "assets");
const cssEntry = join(process.cwd(), "src/app/default-theme.css");
const embeddedAssetsEntry = join(
  process.cwd(),
  "src/server/generated-web-assets.ts",
);

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  const result = await buildBrowserBundle();

  if (!result.success) {
    process.exitCode = 1;
    return;
  }

  const assets = await buildStaticAssets();
  const mainCss = await buildCssContents();
  await writeFile(buildCss(), mainCss);
  await copyOptionalPublicAssets();
  await writeEmbeddedAssetsFile({
    indexHtml: {
      body: buildIndexHtml(),
      contentType: "text/html; charset=utf-8",
    },
    assets: {
      ...assets,
      "/assets/main.css": {
        contentType: "text/css; charset=utf-8",
        body: mainCss,
      },
    },
  });

  await writeFile(join(distDir, "index.html"), buildIndexHtml());
}

async function buildBrowserBundle() {
  return Bun.build({
    entrypoints: [join(process.cwd(), "src/app/main.tsx")],
    outdir: assetsDir,
    target: "browser",
    minify: true,
  });
}

function buildIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Staden Outliner</title>
    <link rel="stylesheet" href="/assets/main.css" />
  </head>
  <body class="max-w-full mx-20 text-primary bg-background">
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>
`;
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

async function buildStaticAssets(): Promise<
  Record<string, { body: string; contentType: string }>
> {
  const mainJs = await Bun.file(join(assetsDir, "main.js")).text();
  const assets: Record<string, { body: string; contentType: string }> = {
    "/assets/main.js": {
      contentType: "application/javascript; charset=utf-8",
      body: mainJs,
    },
  };

  for (const [routePath, filePath] of [
    ["/public/vega.js", join(process.cwd(), "public/vega.js")],
    ["/public/vega-lite.js", join(process.cwd(), "public/vega-lite.js")],
    ["/public/vega-embed.js", join(process.cwd(), "public/vega-embed.js")],
  ] as const) {
    const body = await readOptionalText(filePath);
    if (!body) {
      continue;
    }

    assets[routePath] = {
      contentType: "application/javascript; charset=utf-8",
      body,
    };
  }

  return assets;
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

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await Bun.file(path).text();
  } catch {
    return undefined;
  }
}

async function writeEmbeddedAssetsFile(assets: {
  indexHtml: { body: string; contentType: string };
  assets: Record<string, { body: string; contentType: string }>;
}): Promise<void> {
  await writeFile(
    embeddedAssetsEntry,
    `export const embeddedWebAssets = ${JSON.stringify(assets, null, 2)} as const;
`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

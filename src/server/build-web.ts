import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
  await cp(join(process.cwd(), "public"), join(distDir, "public"), {
    recursive: true,
  });
  await writeEmbeddedAssetsFile({
    indexHtml: buildIndexHtml(),
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

  return {
    "/assets/main.js": {
      contentType: "application/javascript; charset=utf-8",
      body: mainJs,
    },
    "/public/vega.js": {
      contentType: "application/javascript; charset=utf-8",
      body: await Bun.file(join(process.cwd(), "public/vega.js")).text(),
    },
    "/public/vega-lite.js": {
      contentType: "application/javascript; charset=utf-8",
      body: await Bun.file(join(process.cwd(), "public/vega-lite.js")).text(),
    },
    "/public/vega-embed.js": {
      contentType: "application/javascript; charset=utf-8",
      body: await Bun.file(join(process.cwd(), "public/vega-embed.js")).text(),
    },
  };
}

async function writeEmbeddedAssetsFile(assets: {
  indexHtml: string;
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

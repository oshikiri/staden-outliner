import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

const distDir = join(process.cwd(), "dist");
const assetsDir = join(distDir, "assets");
const cssEntry = join(process.cwd(), "src/app/default-theme.css");

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(process.cwd(), "src/app/main.tsx")],
    outdir: assetsDir,
    target: "browser",
    minify: true,
  });

  if (!result.success) {
    process.exitCode = 1;
    return;
  }

  await writeFile(buildCss(), await buildCssContents());
  await cp(join(process.cwd(), "public"), join(distDir, "public"), {
    recursive: true,
  });

  await writeFile(join(distDir, "index.html"), buildIndexHtml());
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

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

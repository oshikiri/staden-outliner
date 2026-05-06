import { access, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, normalize, resolve } from "node:path";

import { honoApiApp } from "@/server/api/app";
import { logInfo } from "@/shared/logger";
import { DEFAULT_PORT } from "@/server/lib/env/defaultPort";

const DEFAULT_HOST = "127.0.0.1";
const DIST_DIR = join(process.cwd(), "dist");
const INDEX_HTML_PATH = join(import.meta.dir, "index.html");
let indexHtml: string | undefined;

type ServerOptions = {
  host?: string;
  port?: number;
};

export function createWebServer(options: ServerOptions = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const server = Bun.serve({
    hostname: host,
    port,
    fetch: async (request) => {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        return honoApiApp.fetch(request);
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: {
            Allow: "GET,HEAD",
          },
        });
      }

      return serveStaticOrIndex(url.pathname);
    },
  });

  logInfo(`Bun web server listening on http://${host}:${port}`);
  return server;
}

async function serveStaticOrIndex(pathname: string): Promise<Response> {
  const filePath = getSafeDistPath(pathname);
  if (filePath) {
    const file = Bun.file(filePath);
    if (await exists(filePath)) {
      return new Response(file);
    }
  }

  return new Response(await getIndexHtml(), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function getSafeDistPath(pathname: string): string | undefined {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath === "/" ? "/index.html" : decodedPath;
  const resolvedPath = resolve(DIST_DIR, `.${relativePath}`);
  const normalizedDistDir = normalize(`${DIST_DIR}/`);
  const normalizedResolvedPath = normalize(resolvedPath);

  if (!normalizedResolvedPath.startsWith(normalizedDistDir)) {
    return undefined;
  }

  return resolvedPath;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function getIndexHtml(): Promise<string> {
  if (indexHtml !== undefined) {
    return indexHtml;
  }

  indexHtml = await Bun.file(INDEX_HTML_PATH).text();
  return indexHtml;
}

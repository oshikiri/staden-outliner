import { access, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, normalize, resolve } from "node:path";

import { honoApiApp } from "@/app/api/hono/app";
import { logInfo } from "@/app/lib/logger";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
const DIST_DIR = join(process.cwd(), "dist");

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

  return new Response(Bun.file(join(DIST_DIR, "index.html")));
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

import { resolveApiApp } from "@/app/api/hono/apiRoute";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3001;

type ServerOptions = {
  host?: string;
  port?: number;
};

type ResolvedServerOptions = {
  host: string;
  port: number;
};

export function createApiServer(options: ServerOptions = {}) {
  const { host, port } = resolveApiServerOptions(options);

  const server = Bun.serve({
    hostname: host,
    port,
    fetch: async (request) => {
      try {
        return await resolveApiApp(request).fetch(request);
      } catch (error) {
        console.error(error);
        return internalServerErrorResponse();
      }
    },
  });

  console.log(`Bun API server listening on http://${host}:${port}`);
  return server;
}

export function resolveApiServerOptions(
  options: ServerOptions = {},
): ResolvedServerOptions {
  return {
    host: options.host ?? DEFAULT_HOST,
    port: options.port ?? DEFAULT_PORT,
  };
}

function internalServerErrorResponse(): Response {
  return new Response("Internal Server Error", {
    status: 500,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

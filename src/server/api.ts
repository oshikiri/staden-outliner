import { Buffer } from "node:buffer";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { Readable } from "node:stream";

import { resolveApiApp } from "@/app/api/hono/nextRoute";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3001;

type ServerOptions = {
  host?: string;
  port?: number;
};

export function createApiServer(options: ServerOptions = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  return createServer(async (req, res) => {
    try {
      const request = toRequest(req, host, port);
      const response = await resolveApiApp(request).fetch(request);
      await writeResponse(res, response);
    } catch (error) {
      console.error(error);
      writeInternalServerError(res);
    }
  }).listen(port, host, () => {
    console.log(`Hono API server listening on http://${host}:${port}`);
  });
}

export function toRequest(
  incoming: IncomingMessage,
  host: string,
  port: number,
): Request {
  const requestHost = incoming.headers.host ?? `${host}:${port}`;
  const requestUrl = new URL(incoming.url ?? "/", `http://${requestHost}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (typeof value === "undefined") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
      continue;
    }
    headers.set(name, value);
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: incoming.method ?? "GET",
    headers,
  };

  const method = init.method ?? "GET";

  if (!isBodylessMethod(method)) {
    init.body = Readable.toWeb(incoming) as unknown as BodyInit;
    init.duplex = "half";
  }

  return new Request(requestUrl, init);
}

async function writeResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    res.write(Buffer.from(value));
  }
  res.end();
}

function writeInternalServerError(res: ServerResponse): void {
  res.statusCode = 500;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Internal Server Error");
}

function isBodylessMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

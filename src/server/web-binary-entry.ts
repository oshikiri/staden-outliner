import { readStadenRoot, setStadenRoot } from "@/app/lib/env/stadenRoot";
import { close, open } from "@/app/lib/sqlite";
import { logError } from "@/app/lib/logger";

import { createWebServer } from "./web";
import { createShutdownHandler } from "./shutdown";

async function main() {
  setStadenRoot(readStadenRoot(process.argv.slice(2)));
  await open();
  const server = createWebServer({
    host: Bun.env.HOST,
    port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
  });
  const shutdown = createShutdownHandler({
    stop: () => server.stop(),
    close,
  });

  process.once("SIGINT", () => {
    void shutdown().catch(handleShutdownError);
  });
  process.once("SIGTERM", () => {
    void shutdown().catch(handleShutdownError);
  });
}

void main().catch((error) => {
  logError(error);
  process.exit(1);
});

function handleShutdownError(error: unknown): void {
  logError(error);
  process.exitCode = 1;
}

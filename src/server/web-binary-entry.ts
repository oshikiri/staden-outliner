import { readStadenRoot, setStadenRoot } from "@/app/lib/env/stadenRoot";
import { open } from "@/app/lib/sqlite";
import { logError } from "@/app/lib/logger";

import { createWebServer } from "./web";

async function main() {
  setStadenRoot(readStadenRoot(process.argv.slice(2)));
  await open();
  createWebServer({
    host: Bun.env.HOST,
    port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
  });
}

void main().catch((error) => {
  logError(error);
  process.exit(1);
});

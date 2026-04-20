import { open } from "@/app/lib/sqlite";

import { createWebServer } from "./web";

async function main() {
  await open();
  createWebServer({
    host: Bun.env.HOST,
    port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

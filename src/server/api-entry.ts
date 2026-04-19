import { open } from "@/app/lib/sqlite";

import { createApiServer } from "./api";

async function main() {
  await open();
  createApiServer({
    host: Bun.env.HOST,
    port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

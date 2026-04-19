import { open } from "@/app/lib/sqlite";

import { createApiServer } from "./api";

async function main() {
  await open();
  createApiServer({
    host: process.env.HOST,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

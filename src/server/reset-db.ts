import { initializeStadenRoot } from "@/server/lib/env/stadenRoot";
import { logError } from "@/shared/logger";

import { initializeDatabase } from "./api/initialize/usecase";

async function main() {
  initializeStadenRoot(process.argv.slice(2));
  await initializeDatabase();
}

void main().catch((error) => {
  logError(error);
  process.exit(1);
});

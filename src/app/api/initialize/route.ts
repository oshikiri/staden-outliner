import { BulkImporter } from "../../lib/importer/bulk_importer";
import * as sqlite from "../../lib/sqlite";

export async function POST(_request: Request) {
  await initializeSqlite();

  return new Response("", {
    status: 204,
  });
}

async function initializeSqlite(): Promise<void> {
  console.log("Initializing database...");

  // RV: No error handling around migration/import. Wrap in try/catch and ensure `sqlite.close()` in finally.
  sqlite.open();
  sqlite.initializeAllTables();

  const importer = new BulkImporter();
  // RV: Ensure required env vars (e.g., STADEN_ROOT) are validated before running importer to avoid ambiguous failures.
  const { blocks, files, links } = await importer.run();

  const BATCH_SIZE = 1000;
  await sqlite.batchInsertBlocks(blocks, BATCH_SIZE);
  await sqlite.batchInsertFiles(files, BATCH_SIZE);
  await sqlite.batchInsertLinks(links);

  sqlite.close();

  console.log("Database initialized");

  return;
}

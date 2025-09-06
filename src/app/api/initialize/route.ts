// RV: Mixed relative import styles across the file; keep a consistent style for readability.
import { BulkImporter } from "../../lib/importer/bulk_importer";
import * as sqlite from "./../../lib/sqlite";

// RV: Exposing a DB initialization via GET is unsafe; prefer a protected POST with auth and CSRF protections.
export async function GET() {
  const inserted = await initializeSqlite();

  // RV: Missing Content-Type header (application/json). Also, the return value is always 0; consider returning counts for blocks/files/links.
  return new Response(JSON.stringify({ inserted }), {});
}

async function initializeSqlite(): Promise<number> {
  console.log("Initializing database...");

  // RV: `sqlite.open()` is declared async; call should be awaited or the function should be made sync to reflect actual behavior.
  sqlite.open();
  // RV: No error handling around migration/import. Wrap in try/catch and ensure `sqlite.close()` in finally.
  sqlite.initializeAllTables();

  const importer = new BulkImporter();
  // RV: Ensure required env vars (e.g., STADEN_ROOT) are validated before running importer to avoid ambiguous failures.
  const { blocks, files, links } = await importer.run();

  const BATCH_SIZE = 1000;
  await sqlite.batchInsertBlocks(blocks, BATCH_SIZE);
  await sqlite.batchInsertFiles(files, BATCH_SIZE);
  await sqlite.batchInsertLinks(links);

  console.log("Database initialized");
  // RV: `sqlite.close()` is declared async; await or make symmetric with open; ensure it runs even on error.
  sqlite.close();

  // RV: Always returns 0; return meaningful metrics (e.g., number of inserted rows) for observability.
  return 0;
}

import { BulkImporter } from "../../lib/importer/bulk_importer";
import * as sqlite from "../../lib/sqlite";

// @owner Exposing a DB initialization via GET is unsafe; prefer a protected POST with auth and CSRF protections.
// See https://github.com/oshikiri/staden-outliner/commit/b677b28a4a41f1daf16776149fc7a3a9a0f1bf66
export async function GET() {
  await initializeSqlite();

  return new Response("", {
    status: 204,
  });
}

async function initializeSqlite(): Promise<void> {
  console.log("Initializing database...");

  // RV: No error handling around migration/import. Wrap in try/catch and ensure `sqlite.close()` in finally.
  await sqlite.open();
  sqlite.initializeAllTables();

  const importer = new BulkImporter();
  const { blocks, files, links } = await importer.run();

  const BATCH_SIZE = 1000;
  await sqlite.batchInsertBlocks(blocks, BATCH_SIZE);
  await sqlite.batchInsertFiles(files, BATCH_SIZE);
  await sqlite.batchInsertLinks(links);

  await sqlite.close();

  console.log("Database initialized");

  return;
}

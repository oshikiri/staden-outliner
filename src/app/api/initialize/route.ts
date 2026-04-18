import { BulkImporter } from "../../lib/importer/bulk_importer";
import * as sqlite from "../../lib/sqlite";

export async function POST() {
  await initializeSqlite();

  return new Response(null, {
    status: 204,
  });
}

async function initializeSqlite(): Promise<void> {
  console.log("Initializing database...");

  await sqlite.open();
  try {
    sqlite.initializeAllTables();

    const importer = new BulkImporter();
    const { blocks, pageIdByBlockId, files, links } = await importer.run();

    const BATCH_SIZE = 1000;
    await sqlite.batchInsertBlocks(blocks, BATCH_SIZE, { pageIdByBlockId });
    await sqlite.batchInsertFiles(files, BATCH_SIZE);
    await sqlite.batchInsertLinks(links);
  } finally {
    await sqlite.close();
  }

  console.log("Database initialized");

  return;
}

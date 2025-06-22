import { BulkImporter } from "../../lib/importer/bulk_importer";
import * as sqlite from "./../../lib/sqlite";

export async function GET() {
  const inserted = await initializeSqlite();

  return new Response(JSON.stringify({ inserted }), {});
}

async function initializeSqlite(): Promise<number> {
  console.log("Initializing database...");

  sqlite.open();
  sqlite.initializeAllTables();

  const importer = new BulkImporter();
  const { blocks, files, links } = await importer.run();

  const BATCH_SIZE = 1000;
  await sqlite.batchInsertBlocks(blocks, BATCH_SIZE);
  await sqlite.batchInsertFiles(files, BATCH_SIZE);
  await sqlite.batchInsertLinks(links);

  console.log("Database initialized");
  sqlite.close();

  return 0;
}

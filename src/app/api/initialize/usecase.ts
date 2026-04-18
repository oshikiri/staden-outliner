import * as sqlite from "../../lib/sqlite";

export async function initializeDatabase(): Promise<void> {
  console.log("Initializing database...");

  await sqlite.open();
  try {
    sqlite.initializeAllTables();

    const { BulkImporter } = await import("../../lib/importer/bulk_importer");
    const importer = new BulkImporter();
    const { blocks, pageIdByBlockId, files, links } = await importer.run();

    const batchSize = 1000;
    await sqlite.batchInsertBlocks(blocks, batchSize, { pageIdByBlockId });
    await sqlite.batchInsertFiles(files, batchSize);
    await sqlite.batchInsertLinks(links);
  } finally {
    await sqlite.close();
  }

  console.log("Database initialized");
}

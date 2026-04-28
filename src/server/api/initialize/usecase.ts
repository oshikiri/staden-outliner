import * as sqlite from "@/server/lib/sqlite";
import { logInfo } from "@/shared/logger";

export async function initializeDatabase(): Promise<void> {
  logInfo("Initializing database...");

  await sqlite.open();
  try {
    sqlite.initializeAllTables();

    const { BulkImporter } =
      await import("@/server/lib/importer/bulk_importer");
    const importer = new BulkImporter();
    const { blocks, pageIdByBlockId, files, links } = await importer.run();

    const batchSize = 1000;
    sqlite.clearAllData();
    await sqlite.batchInsertBlocks(blocks, batchSize, { pageIdByBlockId });
    await sqlite.batchInsertFiles(files, batchSize);
    await sqlite.batchInsertLinks(links);
  } finally {
    await sqlite.close();
  }

  logInfo("Database initialized");
}

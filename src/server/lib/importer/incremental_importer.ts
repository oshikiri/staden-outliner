import { createPageFileRecord, type PageFileRecord } from "@/shared/file";
import { Block } from "@/shared/markdown/block";
import { getPageRefTitles } from "@/shared/markdown/utils";
import { logDebug } from "@/shared/logger";

import * as SqliteDb from "@/server/lib/sqlite/db";
import * as SqliteLinks from "@/server/lib/sqlite/links";
import * as PageStore from "@/server/lib/sqlite/pageStore";
import * as SqliteBlocks from "@/server/lib/sqlite/blocks";

export function importBlockRecursive(block: Block): Block {
  const pageId = block.id;
  if (!pageId) {
    throw new Error("Root block id is required for persistence");
  }
  const db = SqliteDb.getDb();
  const importTx = db.transaction(() => {
    refreshLinksFromBlock(block, db);
    SqliteBlocks.batchInsertBlocks(
      block.flatten(),
      1000,
      {
        defaultPageId: pageId,
      },
      db,
    );
  });
  importTx();
  return block;
}

function refreshLinksFromBlock(block: Block, db = SqliteDb.getDb()): void {
  const fromBlockId = block.id || "";
  SqliteLinks.deleteLinksByFromId(fromBlockId, db);
  const targetTitles = [
    ...new Set(
      block
        .flatten()
        .flatMap((currentBlock) => getPageRefTitles(currentBlock.content)),
    ),
  ];
  const targetPages: PageFileRecord[] =
    PageStore.getPagesByTitles(targetTitles);
  const links: [string, string][] = targetPages.map((page) => [
    fromBlockId,
    page.pageId || "",
  ]);

  if (links.length > 0) {
    logDebug("batchInsertLinks", { count: links.length });
    SqliteLinks.batchInsertLinks(links, db);
  }
}

export function createNewFileWithEmptyBlock(
  title: string,
  pageId: string | undefined,
): {
  block: Block;
  file: PageFileRecord;
} {
  if (!pageId) {
    pageId = crypto.randomUUID();
  }
  const file = createPageFileRecord(title, pageId);
  const child = new Block([], 1, []).withId(crypto.randomUUID());
  const page = new Block([], 0, [child]).withId(pageId);
  child.parent = page;

  PageStore.putFile(file);
  SqliteBlocks.batchInsertBlocks([page, child], 2, { defaultPageId: pageId });

  return { block: page, file };
}

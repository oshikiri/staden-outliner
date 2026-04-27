import { Block, create as createBlock } from "@/shared/markdown/block";
import * as FileStore from "@/shared/file";
import { logError, logInfo } from "@/shared/logger";
import { getDb } from "../sqlite/db";
import * as IncrementalImporter from "../importer/incremental_importer";
import { exportOnePageToMarkdown } from "../exporter/incremental_exporter";
import * as PageBlocks from "../sqlite/blocks";
import * as PageStore from "../sqlite/pageStore";

import * as ContentResolver from "./contentResolver";

export async function getPageByTitle(title: string): Promise<Block> {
  const page = await findPageByTitle(title);
  if (!page) {
    return ContentResolver.resolvePageContent(createDraftPage(title));
  }
  return ContentResolver.resolvePageContent(page);
}

export async function updatePageByTitle(
  title: string,
  pagePayload: Block,
): Promise<Block> {
  const pagePrev = await findPageByTitle(title);
  const pageFile = await PageStore.getPageByTitle(title);
  const pageUpdated = createBlock(pagePayload);
  const pageId = pageFile?.pageId || pageUpdated.id;
  if (!pageId) {
    throw new Error(`Missing pageId for page "${title}"`);
  }

  assignPageTreeMetadata(pageUpdated, pageId, undefined);
  pageUpdated.setProperty("title", pagePrev?.getProperty("title") || title);

  try {
    const savePageTx = getDb().transaction(() => {
      if (!pageFile) {
        const pageRecord = FileStore.createPageFileRecord(title, pageId);
        PageStore.putFile(pageRecord);
      }

      IncrementalImporter.importBlockRecursive(pageUpdated);
    });
    savePageTx();
  } catch (error) {
    logError("Failed to save page to sqlite before export", title, error);
    throw error;
  }

  try {
    logInfo("Exporting page to markdown after save", title);
    await exportOnePageToMarkdown(title);
  } catch (error) {
    logError("Failed to export page to markdown after save", title, error);
    throw error;
  }
  return ContentResolver.resolvePageContent(pageUpdated);
}

async function findPageByTitle(title: string): Promise<Block | null> {
  const page = await PageBlocks.getPageBlockByTitle(title);
  if (page) {
    return page;
  }

  // A page record can exist before the corresponding block tree is imported.
  const file = await PageStore.getPageByTitle(title);
  if (!file?.pageId) {
    return null;
  }

  return createDraftPage(title, file.pageId);
}

function createDraftPage(
  title: string,
  pageId: string = crypto.randomUUID(),
): Block {
  const child = new Block([], 1, []).withId(crypto.randomUUID());
  const page = new Block([], 0, [child]).withId(pageId);

  assignPageTreeMetadata(page, pageId, undefined);
  page.setProperty("title", title);

  return page;
}

function assignPageTreeMetadata(
  block: Block,
  pageId: string,
  parent: Block | undefined,
): void {
  if (!parent) {
    block.id = pageId;
    block.parent = undefined;
  } else {
    if (!block.id) {
      block.id = crypto.randomUUID();
    }
    block.parent = parent;
  }

  for (const child of block.children) {
    assignPageTreeMetadata(child, pageId, block);
  }
}

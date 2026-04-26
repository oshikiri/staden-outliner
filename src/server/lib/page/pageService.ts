import { Block, create as createBlock } from "@/shared/markdown/block";
import * as FileStore from "@/shared/file";
import * as IncrementalImporter from "@/server/lib/importer/incremental_importer";
import * as PageBlocks from "@/server/lib/sqlite/blocks";
import * as PageStore from "@/server/lib/sqlite/pageStore";

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

  if (!pageFile) {
    const pageRecord = FileStore.createPageFileRecord(title, pageId);
    await PageStore.putFile(pageRecord);
  }

  await IncrementalImporter.importBlockRecursive(pageUpdated);
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

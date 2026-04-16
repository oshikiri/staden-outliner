import { randomUUID } from "crypto";

import { Block, create as createBlock } from "@/app/lib/markdown/block";
import * as FileStore from "@/app/lib/file";
import * as IncrementalImporter from "@/app/lib/importer/incremental_importer";
import * as PageBlocks from "@/app/lib/sqlite/blocks";
import * as PageStore from "@/app/lib/sqlite/pages";

import * as ContentResolver from "./contentResolver";

export async function getPageByTitle(title: string): Promise<Block> {
  const decodedTitle = decodeURIComponent(title);
  const page = await findPageByTitle(decodedTitle);
  if (!page) {
    return ContentResolver.resolvePageContent(createDraftPage(decodedTitle));
  }
  return ContentResolver.resolvePageContent(page);
}

export async function updatePageByTitle(
  title: string,
  pagePayload: Block,
): Promise<Block> {
  const decodedTitle = decodeURIComponent(title);
  const pagePrev = await findPageByTitle(decodedTitle);
  const pageFile = await PageStore.getPageByTitle(decodedTitle);
  const pageUpdated = createBlock(pagePayload);
  const pageId = pageFile?.pageId || pageUpdated.id;
  if (!pageId) {
    throw new Error(`Missing pageId for page "${decodedTitle}"`);
  }

  assignPageTreeMetadata(pageUpdated, pageId, undefined);
  pageUpdated.setProperty(
    "title",
    pagePrev?.getProperty("title") || decodedTitle,
  );

  if (!pageFile) {
    const file = await FileStore.create(decodedTitle, pageId);
    await PageStore.putFile(file);
  }

  await IncrementalImporter.importBlockRecursive(pageUpdated);
  return ContentResolver.resolvePageContent(pageUpdated);
}

async function findPageByTitle(title: string): Promise<Block | null> {
  const page = await PageBlocks.getPageBlockByTitle(title);
  if (page) {
    return page;
  }

  const file = await PageStore.getPageByTitle(title);
  if (!file?.pageId) {
    return null;
  }

  return createDraftPage(title, file.pageId);
}

function createDraftPage(title: string, pageId: string = randomUUID()): Block {
  const child = new Block([], 1, []).withId(randomUUID());
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
      block.id = randomUUID();
    }
    block.parent = parent;
  }

  for (const child of block.children) {
    assignPageTreeMetadata(child, pageId, block);
  }
}

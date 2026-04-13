import { create as createBlock, type Block } from "@/app/lib/markdown/block";
import * as IncrementalImporter from "@/app/lib/importer/incremental_importer";
import { getPageByTitle as getPageFileByTitle } from "@/app/lib/sqlite";
import { getPageBlockByTitle } from "@/app/lib/sqlite/blocks";

import { resolvePageContent } from "./contentResolver";

export async function getPageByTitle(title: string): Promise<Block> {
  const page = await getOrCreatePageByTitle(title);
  return resolvePageContent(page);
}

export async function updatePageByTitle(
  title: string,
  pagePayload: Block,
): Promise<Block> {
  const pagePrev = await getOrCreatePageByTitle(title);
  const pageUpdated = createBlock(pagePayload);
  pageUpdated.setProperty("title", pagePrev.getProperty("title") || "");

  await IncrementalImporter.importBlockRecursive(pageUpdated);
  return resolvePageContent(pageUpdated);
}

async function getOrCreatePageByTitle(title: string): Promise<Block> {
  const decodedTitle = decodeURIComponent(title);
  const page = await getPageBlockByTitle(decodedTitle);
  if (page) {
    return page;
  }

  const file = await getPageFileByTitle(decodedTitle);
  if (!file) {
    console.info(`No file found with title ${decodedTitle}`);
    const { block } = await IncrementalImporter.createNewFileWithEmptyBlock(
      decodedTitle,
      undefined,
    );
    return block;
  }

  const { block } = await IncrementalImporter.createNewFileWithEmptyBlock(
    decodedTitle,
    file.pageId,
  );
  return block;
}

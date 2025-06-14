import {
  resolveBlockRef,
  resolveAllCommandTokens,
  fillContentMarkdown,
} from "./resolve-components";
import { Block, create as createBlock } from "./../../../lib/markdown/block";
import { isValidUuid } from "@/app/lib/uuid";
import { getPageByTitle } from "@/app/lib/sqlite";
import {
  getPageBlockById,
  getPageBlockByTitle,
} from "./../../../lib/sqlite/blocks";
import * as IncrementalImporter from "@/app/lib/importer/incremental_importer";

import { ResponseError, ResponseUpdated, ResponseSuccess } from "./responses";

type Props = {
  params: Promise<{
    idOrTitle: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { idOrTitle } = await props.params;
  if (!idOrTitle) {
    return new ResponseError("Missing title").toResponse();
  }

  let page = await resolvePage(idOrTitle);

  await resolveBlockRef(page);
  await resolveAllCommandTokens(page);

  if (!page) {
    return new ResponseError("Page not found").toResponse();
  }
  page = fillContentMarkdown(page);
  return new ResponseSuccess(page).toResponse();
}

/**
 * NOTE: When updating the entire content via POST `/pages/[title]`,
 * - The old version on the client side
 * - The new version on the client side
 * - The latest version on the server side
 * need to be 3-way merged.
 *
 * In this case, it seems more reasonable to send only the diff to the server for updating,
 * so this implementation might not be ideal.
 */
export async function POST(req: Request, props: Props) {
  const { idOrTitle } = await props.params;
  if (!idOrTitle) {
    return new ResponseError("Missing title").toResponse();
  }
  const pagePrev = await resolvePage(idOrTitle);
  if (!pagePrev) {
    return new ResponseError("Page not found").toResponse();
  }
  const pageNext: Block = await req.json();
  if (!pageNext) {
    return new ResponseError("Missing page content").toResponse();
  }

  const pageUpdated = createBlock(pageNext);
  pageUpdated.setProperty("title", pagePrev.getProperty("title") || "");
  await IncrementalImporter.importBlockRecursive(pageUpdated);
  await resolveBlockRef(pageUpdated);
  await resolveAllCommandTokens(pageUpdated);

  return new ResponseUpdated(pageUpdated).toResponse();
}

async function resolvePage(idOrTitle: string) {
  const page = await getPageByIdOrTitle(idOrTitle);
  if (page) {
    return page;
  }

  const title = decodeURIComponent(idOrTitle);
  const file = await getPageByTitle(title || "");
  if (!file) {
    console.info(`No file found with title ${title}`);
    const { block } = await IncrementalImporter.createNewFileWithEmptyBlock(
      title,
      undefined,
    );
    return block;
  }

  return getPageBlockById(file.pageId || "");
}

async function getPageByIdOrTitle(
  idOrTitle: string,
): Promise<Block | undefined> {
  console.log({ idOrTitle });
  if (isValidUuid(idOrTitle)) {
    return await getPageBlockById(idOrTitle);
  }

  const title = decodeURIComponent(idOrTitle);
  const block = await getPageBlockByTitle(title);

  if (block) {
    return block;
  }

  const file = await getPageByTitle(title);
  if (!file) {
    return undefined;
  }
  const { block: blockUpdated } =
    await IncrementalImporter.createNewFileWithEmptyBlock(title, file.pageId);
  return blockUpdated;
}

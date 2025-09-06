import {
  resolveBlockRef,
  resolveAllCommandTokens,
  fillContentMarkdown,
} from "./resolve-components";
import { Block, create as createBlock } from "@/app/lib/markdown/block";
import { getPageByTitle } from "@/app/lib/sqlite";
import { getPageBlockByTitle } from "@/app/lib/sqlite/blocks";
import * as IncrementalImporter from "@/app/lib/importer/incremental_importer";

import { ResponseError, ResponseUpdated, ResponseSuccess } from "./responses";

type Props = {
  // RV: In Next.js route handlers, `params` is a plain object; avoid wrapping in Promise and remove unnecessary `await`.
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;
  if (!title) {
    return new ResponseError("Missing title").toResponse();
  }

  let page = await resolvePage(title);

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
  const { title } = await props.params;
  if (!title) {
    return new ResponseError("Missing title").toResponse();
  }
  const pagePrev = await resolvePage(title);
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

async function resolvePage(title: string) {
  const decodedTitle = decodeURIComponent(title);
  const page = await getPageBlockByTitle(decodedTitle);

  if (page) {
    return page;
  }

  const file = await getPageByTitle(decodedTitle);
  if (!file) {
    console.info(`No file found with title ${decodedTitle}`);
    const { block } = await IncrementalImporter.createNewFileWithEmptyBlock(
      decodedTitle,
      undefined,
    );
    return block;
  }

  const { block: blockUpdated } =
    await IncrementalImporter.createNewFileWithEmptyBlock(
      decodedTitle,
      file.pageId,
    );
  return blockUpdated;
}

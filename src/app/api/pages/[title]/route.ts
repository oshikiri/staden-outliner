import { BlockDto, fromBlockDto } from "@/app/lib/markdown/blockDto";
import { getPageByTitle, updatePageByTitle } from "@/app/lib/page/pageService";

import { ResponseError, ResponseUpdated, ResponseSuccess } from "./responses";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;
  if (!title) {
    return new ResponseError("Missing title").toResponse();
  }

  const page = await getPageByTitle(title);
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
  const pagePayload: BlockDto = await req.json();
  if (!pagePayload) {
    return new ResponseError("Missing page content").toResponse();
  }

  const pageUpdated = await updatePageByTitle(title, fromBlockDto(pagePayload));
  return new ResponseUpdated(pageUpdated).toResponse();
}

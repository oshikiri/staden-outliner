import { jsonResponse } from "@/app/api/_shared/http";
import { BlockDto } from "@/app/lib/markdown/blockDto";
import { getPagePayload, isPageRouteError, updatePagePayload } from "./usecase";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;
  const payload = await getPagePayload(title);
  return jsonResponse(payload, {
    status: isPageRouteError(payload) ? 400 : 200,
  });
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
  let pagePayload: BlockDto | null = null;
  try {
    pagePayload = (await req.json()) as BlockDto;
  } catch {
    pagePayload = null;
  }

  const payload = await updatePagePayload(title, pagePayload);
  return jsonResponse(payload, {
    status: isPageRouteError(payload) ? 400 : 200,
  });
}

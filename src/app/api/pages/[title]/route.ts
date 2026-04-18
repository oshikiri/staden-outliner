import { honoApiApp } from "@/app/api/hono/app";
import { buildInternalApiRequest } from "@/app/api/hono/internalRequest";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(req: Request, props: Props) {
  const { title } = await props.params;
  const path = title ? `/api/pages/${encodeURIComponent(title)}` : "/api/pages";
  const honoRequest = buildInternalApiRequest(path, req);
  return honoApiApp.fetch(honoRequest);
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
  const path = title ? `/api/pages/${encodeURIComponent(title)}` : "/api/pages";
  const honoRequest = buildInternalApiRequest(path, req);
  return honoApiApp.fetch(honoRequest);
}

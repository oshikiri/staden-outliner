import { honoApiApp } from "@/app/api/hono/app";
import { buildInternalApiRequest } from "@/app/api/hono/internalRequest";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(req: Request, props: Props) {
  const { title } = await props.params;
  const honoRequest = buildInternalApiRequest(
    `/api/pages/${encodeURIComponent(title || "")}/backlinks`,
    {},
    req,
  );
  return honoApiApp.fetch(honoRequest);
}

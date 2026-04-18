import { honoApiApp } from "@/app/api/hono/app";
import { buildInternalApiRequest } from "@/app/api/hono/internalRequest";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function POST(req: Request, props: Props) {
  const { title } = await props.params;
  const path = `/api/pages/${encodeURIComponent(title || "")}/update_markdown`;
  const honoRequest = buildInternalApiRequest(path, { method: "POST" }, req);
  return honoApiApp.fetch(honoRequest);
}

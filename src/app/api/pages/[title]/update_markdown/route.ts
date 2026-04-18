import { jsonResponse } from "@/app/api/_shared/http";
import { updateMarkdownPayload } from "./usecase";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function POST(_req: Request, props: Props) {
  const { title } = await props.params;
  return jsonResponse(await updateMarkdownPayload(title));
}

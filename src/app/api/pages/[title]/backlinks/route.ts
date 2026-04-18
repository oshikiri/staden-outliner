import { jsonResponse } from "@/app/api/_shared/http";
import { getBacklinkPayload } from "./usecase";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;
  return jsonResponse(await getBacklinkPayload(title || ""));
}

import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";
import { type UpdateMarkdownRouteResponseBody } from "../contracts";

export async function updateMarkdownPayload(
  title: string,
): Promise<UpdateMarkdownRouteResponseBody> {
  await exportOnePageToMarkdown(title);
}

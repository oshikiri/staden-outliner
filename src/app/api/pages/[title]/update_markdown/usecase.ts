import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";

export async function updateMarkdownPayload(
  title: string,
): Promise<Record<string, never>> {
  await exportOnePageToMarkdown(title);
  return {};
}

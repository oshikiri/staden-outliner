import type { File } from "@/app/lib/file";
import { getPagesByPrefix } from "@/app/lib/sqlite/pages";

export async function getFilesPayload(prefix: string): Promise<File[]> {
  return getPagesByPrefix(prefix);
}

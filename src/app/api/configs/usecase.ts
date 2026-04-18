import { getAllConfigs } from "@/app/lib/file/config";
import type { Configs } from "@/app/lib/file/config";

export async function getConfigsPayload(): Promise<Configs> {
  return getAllConfigs();
}

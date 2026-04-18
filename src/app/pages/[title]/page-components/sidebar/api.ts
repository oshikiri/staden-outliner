import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import { apiFetch } from "@/app/lib/client/api";
import {
  configsRoutePath,
  filesRoutePath,
  readConfigsResponse,
  readFilesResponse,
} from "@/app/api/contracts";

export async function getAllConfigs(): Promise<Configs> {
  const response = await apiFetch(configsRoutePath, {
    cache: "force-cache",
  });
  return readConfigsResponse(response);
}

export async function getAllFiles(): Promise<File[]> {
  const response = await apiFetch(filesRoutePath(), {
    cache: "force-cache",
  });
  return readFilesResponse(response);
}

export async function getFilesByPrefix(prefix: string): Promise<File[]> {
  const response = await apiFetch(filesRoutePath(prefix), {});
  return readFilesResponse(response);
}

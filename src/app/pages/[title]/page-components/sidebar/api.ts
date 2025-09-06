import { File } from "@/app/lib/file";

// RV: Returning Promise<any> obscures the config structure; define a Config interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAllConfigs(): Promise<any> {
  const response = await fetch("/api/configs", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  const json = await response.json();
  return json;
}

export async function getAllFiles(): Promise<File[]> {
  const response = await fetch("/api/files", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  const json = await response.json();
  return json;
}

export async function getFilesByPrefix(prefix: string): Promise<File[]> {
  const response = await fetch(`/api/files?prefix=${prefix}`, {
    next: { revalidate: 30 },
  });
  const json = await response.json();
  return json;
}

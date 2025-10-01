import type { Configs } from "@/app/lib/file/config";
import { File } from "@/app/lib/file";

export async function getAllConfigs(): Promise<Configs> {
  const response = await fetch("/api/configs", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  const json = (await response.json()) as Partial<Configs>;
  return {
    favorites: Array.isArray(json.favorites) ? json.favorites : [],
  };
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

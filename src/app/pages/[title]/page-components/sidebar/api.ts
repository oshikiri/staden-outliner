import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";

export async function getAllConfigs(): Promise<Configs> {
  const response = await fetch("/api/configs", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  const json = await parseJsonResponse<Partial<Configs>>(response);
  return {
    favorites: Array.isArray(json.favorites) ? json.favorites : [],
  };
}

export async function getAllFiles(): Promise<File[]> {
  const response = await fetch("/api/files", {
    cache: "force-cache",
    next: { revalidate: 30 },
  });
  return await parseJsonResponse<File[]>(response);
}

export async function getFilesByPrefix(prefix: string): Promise<File[]> {
  const response = await fetch(`/api/files?prefix=${prefix}`, {
    next: { revalidate: 30 },
  });
  return await parseJsonResponse<File[]>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const text = await response.text();
  if (text.trim() === "") {
    throw new Error("Empty JSON response");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON response");
  }
}

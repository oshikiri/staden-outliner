import path from "node:path";

import { getStadenRoot } from "../env/stadenRoot";

export interface Configs {
  favorites: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isConfigs(value: unknown): value is Configs {
  return (
    isRecord(value) &&
    Array.isArray(value.favorites) &&
    value.favorites.every((favorite) => typeof favorite === "string")
  );
}

export async function getAllConfigs(): Promise<Configs> {
  const configFile = path.join(getStadenRoot(), "config.json");
  const file = Bun.file(configFile);
  if (!(await file.exists())) {
    return { favorites: [] };
  }
  const configs = JSON.parse(await file.text());
  if (!isConfigs(configs)) {
    return { favorites: [] };
  }

  return configs;
}

import path from "node:path";

import { isConfigs, type Configs } from "@/app/lib/file/config";
import { getStadenRoot } from "@/server/lib/env/stadenRoot";

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

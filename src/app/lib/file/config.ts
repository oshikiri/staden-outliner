import * as fs from "fs";
import { parse } from "yaml";

const stadenRoot: string = process.env.STADEN_ROOT || "";

export async function getAllConfigs() {
  const configFile = `${stadenRoot}/config.yaml`;
  if (!fs.existsSync(configFile)) {
    // RV: Defaulting `favorites` to [""] introduces an empty item. Prefer an empty array for a clean default.
    return { favorites: [""] };
  }
  const yamlTxt = fs.readFileSync(configFile, "utf8");
  const configs = parse(yamlTxt);

  // RV: Same default here; keep defaults consistent and empty to avoid UI artifacts.
  const response = { favorites: [""] };
  if (configs?.favorites) {
    response.favorites = configs.favorites;
  }

  return response;
}

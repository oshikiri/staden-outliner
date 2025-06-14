import * as fs from "fs";
import { parse } from "yaml";

const stadenRoot: string = process.env.STADEN_ROOT || "";

export async function getAllConfigs() {
  const configFile = `${stadenRoot}/config.yaml`;
  if (!fs.existsSync(configFile)) {
    return { favorites: [""] };
  }
  const yamlTxt = fs.readFileSync(configFile, "utf8");
  const configs = parse(yamlTxt);

  const response = { favorites: [""] };
  if (configs?.favorites) {
    response.favorites = configs.favorites;
  }

  return response;
}

import * as fs from "fs";

const stadenRoot: string = process.env.STADEN_ROOT || "";

export interface Configs {
  favorites: string[];
}

export async function getAllConfigs(): Promise<Configs> {
  const configFile = `${stadenRoot}/config.json`;
  if (!fs.existsSync(configFile)) {
    return { favorites: [] };
  }
  const jsonTxt = fs.readFileSync(configFile, "utf8");
  const configs = JSON.parse(jsonTxt);

  const response: Configs = { favorites: [] };
  if (configs?.favorites) {
    response.favorites = configs.favorites;
  }

  return response;
}

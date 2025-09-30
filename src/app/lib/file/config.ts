import * as fs from "fs";

const stadenRoot: string = process.env.STADEN_ROOT || "";

export async function getAllConfigs() {
  const configFile = `${stadenRoot}/config.json`;
  if (!fs.existsSync(configFile)) {
    return { favorites: [] };
  }
  const jsonTxt = fs.readFileSync(configFile, "utf8");
  const configs = JSON.parse(jsonTxt);

  const response = { favorites: [] };
  if (configs?.favorites) {
    response.favorites = configs.favorites;
  }

  return response;
}

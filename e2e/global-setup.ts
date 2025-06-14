import { FullConfig, chromium } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log(config.rootDir);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/api/initialize");
  await page.waitForTimeout(3000);
}

export default globalSetup;

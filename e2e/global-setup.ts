import { FullConfig, expect, request } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log(config.rootDir);
  const requestContext = await request.newContext();

  try {
    const response = await requestContext.get(
      "http://localhost:3000/api/initialize",
    );

    expect(response.ok()).toBeTruthy();
  } finally {
    await requestContext.dispose();
  }
}

export default globalSetup;

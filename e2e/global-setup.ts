import { FullConfig, request } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000";
  const apiRequest = await request.newContext({ baseURL });
  const response = await apiRequest.get("/api/initialize");

  if (response.status() !== 204) {
    throw new Error(`/api/initialize returned status ${response.status()}`);
  }

  await apiRequest.dispose();
}

export default globalSetup;

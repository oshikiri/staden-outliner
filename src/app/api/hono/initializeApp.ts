import { Hono } from "hono";

import { noContentResponse, type ApiEnv } from "./http";

const initializeApp = new Hono<ApiEnv>().basePath("/api");

initializeApp.post("/initialize", async (c) => {
  const { initializeDatabase } = await import("@/app/api/initialize/usecase");
  await initializeDatabase();
  return noContentResponse(c);
});

export const honoInitializeApp = initializeApp;

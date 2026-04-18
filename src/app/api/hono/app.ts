import { Hono } from "hono";

import { getConfigsPayload } from "@/app/api/configs/usecase";
import { getFilesPayload } from "@/app/api/files/usecase";
import { getImagePayload } from "@/app/api/images/usecase";
import { getBacklinkPayload } from "@/app/api/pages/[title]/backlinks/usecase";

const configsRoutes = new Hono();
configsRoutes.get("/configs", async (c) => {
  return c.json(await getConfigsPayload());
});

const filesRoutes = new Hono();
filesRoutes.get("/files", async (c) => {
  const prefix = c.req.query("prefix") ?? "";
  return c.json(await getFilesPayload(prefix));
});

const imagesRoutes = new Hono();
imagesRoutes.get("/images", async (c) => {
  const payload = await getImagePayload(c.req.query("path") ?? "");
  if (!payload.ok) {
    return c.text(payload.message, payload.status);
  }

  return new Response(payload.body as BodyInit, {
    headers: {
      "Content-Type": payload.contentType,
    },
  });
});

const pagesRoutes = new Hono();
pagesRoutes.get("/:title/backlinks", async (c) => {
  const title = c.req.param("title") ?? "";
  return c.json(await getBacklinkPayload(title));
});

const apiApp = new Hono().basePath("/api");
apiApp.route("/", configsRoutes);
apiApp.route("/", filesRoutes);
apiApp.route("/", imagesRoutes);
apiApp.route("/pages", pagesRoutes);

export const honoApiApp = apiApp;

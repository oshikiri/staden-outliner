import { Hono } from "hono";

import { getConfigsPayload } from "@/app/api/configs/usecase";
import { getFilesPayload } from "@/app/api/files/usecase";
import { getImagePayload } from "@/app/api/images/usecase";
import { getBacklinkPayload } from "@/app/api/pages/[title]/backlinks/usecase";
import { updateMarkdownPayload } from "@/app/api/pages/[title]/update_markdown/usecase";

import {
  ApiEnv,
  binaryResponse,
  internalServerError,
  requiredQuery,
} from "./http";

const configsRoutes = new Hono<ApiEnv>();
configsRoutes.get("/configs", async (c) => {
  return c.json(await getConfigsPayload());
});

const filesRoutes = new Hono<ApiEnv>();
filesRoutes.get("/files", async (c) => {
  const prefix = c.req.query("prefix") ?? "";
  return c.json(await getFilesPayload(prefix));
});

const imagesRoutes = new Hono<ApiEnv>();
imagesRoutes.get("/images", async (c) => {
  const path = requiredQuery(c, "path", "Missing path parameter");
  if (path instanceof Response) {
    return path;
  }

  const payload = await getImagePayload(path);
  if (!payload.ok) {
    return c.text(payload.message, payload.status);
  }

  return binaryResponse(c, payload.body, payload.contentType);
});

const pagesRoutes = new Hono<ApiEnv>();
pagesRoutes.get("/:title/backlinks", async (c) => {
  const title = c.req.param("title") ?? "";
  return c.json(await getBacklinkPayload(title));
});
pagesRoutes.post("/:title/update_markdown", async (c) => {
  const title = c.req.param("title") ?? "";
  await updateMarkdownPayload(title);
  return c.json({});
});

const apiApp = new Hono<ApiEnv>().basePath("/api");
apiApp.onError((_error, c) => {
  return internalServerError(c);
});
apiApp.route("/", configsRoutes);
apiApp.route("/", filesRoutes);
apiApp.route("/", imagesRoutes);
apiApp.route("/pages", pagesRoutes);

export const honoApiApp = apiApp;

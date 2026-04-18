import { Hono } from "hono";

import { getConfigsPayload } from "@/app/api/configs/usecase";
import { getFilesPayload } from "@/app/api/files/usecase";
import { getImagePayload } from "@/app/api/images/usecase";
import { getBacklinkPayload } from "@/app/api/pages/[title]/backlinks/usecase";
import { updateMarkdownPayload } from "@/app/api/pages/[title]/update_markdown/usecase";
import {
  getPagePayload,
  isPageRouteError,
  updatePagePayload,
} from "@/app/api/pages/[title]/usecase";
import type { BlockDto } from "@/app/lib/markdown/blockDto";

import {
  ApiContext,
  ApiEnv,
  binaryResponse,
  internalServerError,
  jsonResponse,
  optionalJsonBody,
  requiredQuery,
  textResponse,
} from "./http";

const configsRoutes = new Hono<ApiEnv>();
configsRoutes.get("/configs", async (c) => {
  return jsonResponse(c, await getConfigsPayload());
});

const filesRoutes = new Hono<ApiEnv>();
filesRoutes.get("/files", async (c) => {
  const prefix = c.req.query("prefix") ?? "";
  return jsonResponse(c, await getFilesPayload(prefix));
});

const imagesRoutes = new Hono<ApiEnv>();
imagesRoutes.get("/images", async (c) => {
  const path = requiredQuery(c, "path", "Missing path parameter");
  if (path instanceof Response) {
    return path;
  }

  const payload = await getImagePayload(path);
  if (!payload.ok) {
    return textResponse(c, payload.message, payload.status);
  }

  return binaryResponse(c, payload.body, payload.contentType);
});

const pagesRoutes = new Hono<ApiEnv>();
async function respondPageGet(c: ApiContext) {
  const title = c.req.param("title") ?? "";
  const payload = await getPagePayload(title);
  return jsonResponse(c, payload, isPageRouteError(payload) ? 400 : 200);
}

async function respondPagePost(c: ApiContext) {
  const title = c.req.param("title") ?? "";
  const pagePayload = await optionalJsonBody<BlockDto>(c);
  const payload = await updatePagePayload(title, pagePayload);
  return jsonResponse(c, payload, isPageRouteError(payload) ? 400 : 200);
}

pagesRoutes.get("/", respondPageGet);
pagesRoutes.get("/:title", respondPageGet);
pagesRoutes.post("/", respondPagePost);
pagesRoutes.post("/:title", respondPagePost);
pagesRoutes.get("/:title/backlinks", async (c) => {
  const title = c.req.param("title") ?? "";
  return jsonResponse(c, await getBacklinkPayload(title));
});
pagesRoutes.post("/:title/update_markdown", async (c) => {
  const title = c.req.param("title") ?? "";
  await updateMarkdownPayload(title);
  return jsonResponse(c, {});
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

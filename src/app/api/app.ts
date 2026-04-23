import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

import { getAllConfigs } from "@/server/lib/file/config";
import { exportOnePageToMarkdown } from "@/server/lib/exporter/incremental_exporter";
import { getImagePayload } from "@/app/api/images/usecase";
import { isBlockDto } from "@/shared/markdown/blockDto";
import {
  createPageRouteError,
  isPageRouteError,
  type PageRouteRequestBody,
} from "@/app/api/pages/[title]/contracts";
import { getBacklinkPayload } from "@/app/api/pages/[title]/backlinks/usecase";
import { getPagePayload } from "@/app/api/pages/[title]/usecase";
import { getPagesByPrefix } from "@/server/lib/sqlite/pages";
import { updatePagePayload } from "@/app/api/pages/[title]/usecase";

import {
  type GlobalErrorResponse,
  binaryResponse,
  internalServerError,
  noContentResponse,
} from "./http";
import type { ApplyGlobalResponse } from "hono/client";

const configsRoutes = new Hono().get("/configs", async (c) => {
  return c.json(await getAllConfigs());
});

const filesQueryValidator = validator("query", (value) => {
  const prefix = value.prefix;
  return {
    prefix: typeof prefix === "string" ? prefix : "",
  };
});

const filesRoutes = new Hono().get("/files", filesQueryValidator, async (c) => {
  const { prefix } = c.req.valid("query");
  return c.json(await getPagesByPrefix(prefix));
});

const imagePathValidator = validator("query", (value, c) => {
  const path = value.path;
  if (typeof path !== "string" || path.length === 0) {
    return c.text("Missing path parameter", 400);
  }
  return { path };
});

const imagesRoutes = new Hono().get(
  "/images",
  imagePathValidator,
  async (c) => {
    const { path } = c.req.valid("query");
    const payload = await getImagePayload(path);
    if (!payload.ok) {
      return c.text(payload.message, payload.status);
    }

    return binaryResponse(c, payload.body, payload.contentType);
  },
);

const pageTitleValidator = validator("param", (value, c) => {
  const title = value.title;
  if (typeof title !== "string" || title.length === 0) {
    return c.json(createPageRouteError("Missing title"), 400);
  }
  return { title };
});

const pagePayloadValidator = validator(
  "json",
  (value, c): PageRouteRequestBody | Response => {
    if (!isBlockDto(value)) {
      return c.json(createPageRouteError("Missing page content"), 400);
    }

    return value;
  },
);

const pagesRoutes = new Hono()
  .get("/:title", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    const payload = await getPagePayload(title);
    return c.json(payload, isPageRouteError(payload) ? 400 : 200);
  })
  .post("/:title", pageTitleValidator, pagePayloadValidator, async (c) => {
    const { title } = c.req.valid("param");
    const payload = await updatePagePayload(title, c.req.valid("json"));
    return c.json(payload, isPageRouteError(payload) ? 400 : 200);
  })
  .get("/:title/backlinks", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    return c.json(await getBacklinkPayload(title));
  })
  .post("/:title/update_markdown", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    await exportOnePageToMarkdown(title);
    return noContentResponse(c);
  });

export const honoApiApp = new Hono()
  .basePath("/api")
  .use(
    "*",
    cors({
      origin: (origin) => origin,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  )
  .onError((_error, c) => {
    if (_error instanceof HTTPException) {
      if (
        _error.status === 400 &&
        c.req.method === "POST" &&
        /^\/api\/pages\/[^/]+$/.test(c.req.path)
      ) {
        return c.json(createPageRouteError("Missing page content"), 400);
      }
      return _error.getResponse();
    }

    return internalServerError(c);
  })
  .post("/initialize", async (c) => {
    const { initializeDatabase } = await import("@/app/api/initialize/usecase");
    await initializeDatabase();
    return noContentResponse(c);
  })
  .route("/", configsRoutes)
  .route("/", filesRoutes)
  .route("/", imagesRoutes)
  .route("/pages", pagesRoutes);

export type AppType = ApplyGlobalResponse<
  typeof honoApiApp,
  {
    500: {
      json: GlobalErrorResponse;
    };
  }
>;

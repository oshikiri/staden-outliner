import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

import { getConfigsPayload } from "@/app/api/configs/usecase";
import { getFilesPayload } from "@/app/api/files/usecase";
import { getImagePayload } from "@/app/api/images/usecase";
import {
  createPageRouteError,
  isPageRouteError,
  type PageRouteRequestBody,
} from "@/app/api/contracts";
import { getBacklinkPayload } from "@/app/api/pages/[title]/backlinks/usecase";
import { updateMarkdownPayload } from "@/app/api/pages/[title]/update_markdown/usecase";
import {
  getPagePayload,
  updatePagePayload,
} from "@/app/api/pages/[title]/usecase";

import {
  ApiContext,
  ApiEnv,
  type GlobalErrorResponse,
  binaryResponse,
  internalServerError,
  noContentResponse,
  jsonResponse,
  textResponse,
} from "./http";
import type { ApplyGlobalResponse } from "hono/client";

const configsRoutes = new Hono<ApiEnv>().get("/configs", async (c) => {
  return jsonResponse(c, await getConfigsPayload());
});

const filesRoutes = new Hono<ApiEnv>().get("/files", async (c) => {
  const prefix = c.req.query("prefix") ?? "";
  return jsonResponse(c, await getFilesPayload(prefix));
});

const imagePathValidator = validator("query", (value, c) => {
  const path = value.path;
  if (typeof path !== "string" || path.length === 0) {
    return c.text("Missing path parameter", 400);
  }
  return { path };
});

const imagesRoutes = new Hono<ApiEnv>().get(
  "/images",
  imagePathValidator,
  async (c) => {
    const { path } = c.req.valid("query");
    const payload = await getImagePayload(path);
    if (!payload.ok) {
      return textResponse(c, payload.message, payload.status);
    }

    return binaryResponse(c, payload.body, payload.contentType);
  },
);

const pageTitleValidator = validator("param", (value, c) => {
  const title = value.title;
  if (typeof title !== "string" || title.length === 0) {
    return jsonResponse(c, createPageRouteError("Missing title"), 400);
  }
  return { title };
});

const pagePayloadValidator = validator(
  "json",
  (value, c): PageRouteRequestBody | Response => {
    if (!value || typeof value !== "object") {
      return jsonResponse(c, createPageRouteError("Missing page content"), 400);
    }

    const pagePayload = value as Partial<PageRouteRequestBody>;
    if (
      typeof pagePayload.depth !== "number" ||
      !Array.isArray(pagePayload.content) ||
      !Array.isArray(pagePayload.children)
    ) {
      return jsonResponse(c, createPageRouteError("Missing page content"), 400);
    }

    return pagePayload as PageRouteRequestBody;
  },
);

async function respondPageGet(c: ApiContext, title: string) {
  const payload = await getPagePayload(title);
  return jsonResponse(c, payload, isPageRouteError(payload) ? 400 : 200);
}

async function respondPagePost(
  c: ApiContext,
  title: string,
  pagePayload: PageRouteRequestBody | null,
) {
  const payload = await updatePagePayload(title, pagePayload);
  return jsonResponse(c, payload, isPageRouteError(payload) ? 400 : 200);
}

const pagesRoutes = new Hono<ApiEnv>()
  .get("/:title", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    return respondPageGet(c, title);
  })
  .post("/:title", pageTitleValidator, pagePayloadValidator, async (c) => {
    const { title } = c.req.valid("param");
    return respondPagePost(c, title, c.req.valid("json"));
  })
  .get("/:title/backlinks", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    return jsonResponse(c, await getBacklinkPayload(title));
  })
  .post("/:title/update_markdown", pageTitleValidator, async (c) => {
    const { title } = c.req.valid("param");
    await updateMarkdownPayload(title);
    return jsonResponse(c, {});
  });

export const honoApiApp = new Hono<ApiEnv>()
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
        _error.message === "Malformed JSON in request body"
      ) {
        return jsonResponse(
          c,
          createPageRouteError("Missing page content"),
          400,
        );
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

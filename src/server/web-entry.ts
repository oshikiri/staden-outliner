import { createWebServer } from "./web";

createWebServer({
  host: Bun.env.HOST,
  port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
});

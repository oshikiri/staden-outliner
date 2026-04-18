import { createApiServer } from "./api";

createApiServer({
  host: process.env.HOST,
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
});

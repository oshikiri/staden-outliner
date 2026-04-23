import { readStadenRoot, setStadenRoot } from "@/server/lib/env/stadenRoot";
import { createWebServer } from "./web";

setStadenRoot(readStadenRoot(process.argv.slice(2)));

createWebServer({
  host: Bun.env.HOST,
  port: Bun.env.PORT ? Number(Bun.env.PORT) : undefined,
});

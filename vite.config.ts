import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001";

  return {
    plugins: [react()],
    define: {
      "process.env.NEXT_PUBLIC_API_BASE_URL": JSON.stringify(apiBaseUrl),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

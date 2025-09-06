import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // RV: Consider setting `timeout` and `expect.timeout` to avoid hanging tests.

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  globalSetup: require.resolve("./e2e/global-setup"),

  webServer: {
    // RV: Injecting env via command string is brittle; prefer `env` property. Ensure the dev server is hardened for tests.
    command: "STADEN_ROOT=./e2e/ npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});

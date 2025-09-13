import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  expect: {
    timeout: 5000,
  },

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
    command: "npm run dev",
    env: {
      STADEN_ROOT: "./e2e/",
    },
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});

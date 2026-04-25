import { defineConfig, devices } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3001";

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
    baseURL: baseUrl,
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
    command: "PORT=3001 ./dist/staden ./e2e/",
    url: baseUrl,
    reuseExistingServer: false,
  },
});

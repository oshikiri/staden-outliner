import { test, expect } from "@playwright/test";

test("when launching the application, it should not display any console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  // Listen for all console messages including errors and warnings
  page.on("console", (msg) => {
    const messageType = msg.type();
    const messageText = msg.text();

    if (messageType === "error") {
      consoleErrors.push(messageText);
    } else if (messageType === "warning") {
      consoleWarnings.push(messageText);
    }
  });

  // Listen for page errors (unhandled exceptions)
  page.on("pageerror", (error) => {
    console.log(`Page Error: ${error.message}`);
    consoleErrors.push(error.message);
  });

  // Wait for the page to fully load and all scripts to execute
  await page.goto("/pages/launch");
  await page.waitForLoadState("networkidle");

  expect(consoleErrors).toHaveLength(0);
});

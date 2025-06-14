import { test, expect } from "@playwright/test";

test("When clicking on a pageref, it navigates to the page with that title", async ({
  page,
}, testInfo) => {
  await page.goto("./pages/pageref");

  await page.getByRole("link", { name: "pageref-target" }).click();

  await expect(page).toHaveURL(/\/pages\/pageref-target$/);

  const screenshot = await page.screenshot();
  await testInfo.attach("screenshot", {
    body: screenshot,
    contentType: "image/png",
  });
});

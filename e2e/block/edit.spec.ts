import { test, expect, Locator } from "@playwright/test";

test("Pressing key adds characters to the content", async ({ page }) => {
  await page.goto("./pages/edit");

  const target = page.getByText("add content");

  async function clickRightmost(element: Locator) {
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width, box.y + box.height / 2);
      await page.waitForTimeout(100);
    }
  }

  await clickRightmost(target);
  await page.keyboard.type("new");
  await page.click("h1");
  await page.waitForTimeout(100);

  expect(await target.textContent()).toBe("add content:new");
});

test("Pressing Backspace deletes one character from the content", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("delete content");

  async function clickRightmost(element: Locator) {
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width, box.y + box.height / 2);
      await page.waitForTimeout(100);
    }
  }

  await clickRightmost(target);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.click("h1");
  await page.waitForTimeout(100);

  expect(await target.textContent()).toBe("delete content:");
});

test("Pressing Tab/Shift+Tab varies the level of the block", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const parent = page.getByText("increase level").first();
  const target = page.getByText("increase target").first();

  // ====================================
  // Tab to increase level
  // ====================================

  // Click on the block to enter edit mode
  await target.click();
  await page.waitForTimeout(100);

  // Press Tab to increase level
  await page.keyboard.press("Tab");
  await page.waitForTimeout(100);

  // Click outside to exit edit mode
  await page.click("h1");
  await page.waitForTimeout(100);

  // Verify the block level has increased
  expect(await getXDiff(parent, target)).toBeGreaterThan(10);

  // ====================================
  // Shift + Tab to decrease level
  // ====================================

  // Click on the block to enter edit mode
  await target.click();
  await page.waitForTimeout(100);

  // Press Shift + Tab to decrease level
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(100);

  // Click outside to exit edit mode
  await page.click("h1");
  await page.waitForTimeout(100);

  // Verify the block level has decreased
  expect(await getXDiff(parent, target)).toBe(0);
});

async function getXDiff(parent: Locator, target: Locator): Promise<number> {
  const parentBox = await parent.boundingBox();
  const targetBox = await target.boundingBox();
  const parentX = parentBox?.x || 0;
  const targetX = targetBox?.x || 0;

  return targetX - parentX;
}

import { test, expect, Locator, Page } from "@playwright/test";

// The tests mutate a shared markdown fixture through the app.
test.describe.configure({ mode: "serial" });

test("when typing characters, it should add them to the block content", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("add content");

  // Click on the block to enter edit mode
  await enterEditMode(page, target);

  // Type "new" at the end of the content
  await page.keyboard.type("new");

  // Click outside to exit edit mode
  await page.click("h1");
  await page.waitForTimeout(100);

  await expect(target).toHaveText("add content:new");
});

test("when saving and reloading, the edited content should persist", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("add content");

  // Click on the block to enter edit mode
  await enterEditMode(page, target);

  // Type "new" at the end of the content
  await page.keyboard.type("new");

  // Click outside to exit edit mode and trigger save
  await page.click("h1");

  // Wait for the rendered content to reflect the saved edit before reloading.
  await expect(page.getByText("add content:new")).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("add content:new")).toBeVisible();
});

test("when pressing backspace, it should delete characters from the block content", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("delete content");

  // Click on the block to enter edit mode
  await enterEditMode(page, target);

  // Press Backspace three times to delete "xxx"
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");

  // Click outside to exit edit mode
  await page.click("h1");
  await page.waitForTimeout(100);

  await expect(target).toHaveText("delete content:");
});

// Enable edit mode by clicking on the block
async function enterEditMode(page: Page, element: Locator) {
  const box = await element.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width, box.y + box.height / 2);
    await page.waitForTimeout(100);
  }
}

test("when pressing Tab/Shift+Tab, it should change the block indentation level", async ({
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

test("when pressing Enter in single-line mode, it should split the block", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("split source");
  await enterEditMode(page, target);

  await page.keyboard.press("Enter");
  await page.keyboard.type("split child");
  await page.click("h1");

  await expect(page.getByText("split source")).toBeVisible();
  await expect(page.getByText("split child")).toBeVisible();
});

test("when pressing Tab in multi-line mode, it should indent text instead of the block", async ({
  page,
}) => {
  await page.goto("./pages/edit");

  const target = page.getByText("multi line target");
  const initialX = (await target.boundingBox())?.x || 0;
  await enterEditMode(page, target);

  await page.keyboard.press("Control+Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("second line");
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Tab");

  await expect(page.locator(".cm-line").nth(0)).toHaveText(
    "  multi line target",
  );
  await expect(page.locator(".cm-line").nth(1)).toHaveText("  second line");

  await page.click("h1");

  const updated = page.getByText(/multi line target\s*second line/);
  await expect(updated).toBeVisible();
  expect(((await updated.boundingBox())?.x || 0) - initialX).toBeLessThan(10);
});

async function getXDiff(parent: Locator, target: Locator): Promise<number> {
  const parentBox = await parent.boundingBox();
  const targetBox = await target.boundingBox();
  const parentX = parentBox?.x || 0;
  const targetX = targetBox?.x || 0;

  return targetX - parentX;
}

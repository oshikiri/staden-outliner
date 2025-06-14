import { test, expect, Locator } from "@playwright/test";

test("In edit mode, pressing key adds characters to the content", async ({
  page,
}) => {
  await page.goto("./pages/edit-block");

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

test("In edit mode, pressing Backspace deletes one character from the content", async ({
  page,
}) => {
  await page.goto("./pages/edit-block");

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

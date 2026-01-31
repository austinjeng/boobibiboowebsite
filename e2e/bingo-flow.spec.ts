import { test, expect } from "@playwright/test";

test.describe("bingo flow", () => {
  test("displays 5x5 bingo grid", async ({ page }) => {
    await page.goto("/bingo");
    await page.waitForLoadState("networkidle");

    // Should show the bingo page title
    await expect(page.locator("text=Bingo")).toBeVisible();

    // Grid should have 25 cells (5x5)
    const gridCells = page.locator(".grid-cols-5 > *");
    const count = await gridCells.count();
    expect(count).toBe(25);
  });

  test("shows progress counters", async ({ page }) => {
    await page.goto("/bingo");
    await page.waitForLoadState("networkidle");

    // Should show completion counter
    await expect(page.locator("text=/\\d+\\/25/")).toBeVisible();
  });

  test("grid cells are clickable links", async ({ page }) => {
    await page.goto("/bingo");
    await page.waitForLoadState("networkidle");

    // Non-completed cells should be links to check-in
    const links = page.locator(".grid-cols-5 a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

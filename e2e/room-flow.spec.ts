import { test, expect } from "@playwright/test";

test.describe("room flow", () => {
  test("can access room page when authenticated", async ({ page }) => {
    await page.goto("/room");
    // Should not redirect since we're authenticated
    await expect(page).toHaveURL("/room");
  });

  test("room page loads without errors", async ({ page }) => {
    await page.goto("/room");
    await page.waitForLoadState("networkidle");

    // Page should render without crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

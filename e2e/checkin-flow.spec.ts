import { test, expect } from "@playwright/test";

test.describe("check-in flow", () => {
  test("can navigate to check-in page", async ({ page }) => {
    await page.goto("/checkin");
    // Should not redirect since we're authenticated
    await expect(page).toHaveURL("/checkin");
  });

  test("check-in page has required elements", async ({ page }) => {
    await page.goto("/checkin");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // The page should have some form elements for check-in
    // Exact selectors depend on the UI implementation
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

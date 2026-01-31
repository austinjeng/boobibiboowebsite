import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test.describe("public pages", () => {
    test("home page loads", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL("/");
    });

    test("bingo page loads", async ({ page }) => {
      await page.goto("/bingo");
      await expect(page).toHaveURL("/bingo");
      await expect(page.locator("text=Bingo")).toBeVisible();
    });

    test("map page loads", async ({ page }) => {
      await page.goto("/map");
      await expect(page).toHaveURL("/map");
    });
  });

  test.describe("protected pages redirect when unauthenticated", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("checkin redirects to sign-in", async ({ page }) => {
      await page.goto("/checkin");
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    test("profile redirects to sign-in", async ({ page }) => {
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    test("room redirects to sign-in", async ({ page }) => {
      await page.goto("/room");
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });
  });

  test.describe("bottom navigation", () => {
    test("navigates between main sections", async ({ page }) => {
      await page.goto("/");

      // Look for navigation links
      const nav = page.locator("nav");
      if (await nav.isVisible()) {
        // Click on bingo link if it exists
        const bingoLink = nav.locator('a[href="/bingo"]');
        if (await bingoLink.isVisible()) {
          await bingoLink.click();
          await expect(page).toHaveURL("/bingo");
        }

        // Click on map link if it exists
        const mapLink = nav.locator('a[href="/map"]');
        if (await mapLink.isVisible()) {
          await mapLink.click();
          await expect(page).toHaveURL("/map");
        }
      }
    });
  });
});

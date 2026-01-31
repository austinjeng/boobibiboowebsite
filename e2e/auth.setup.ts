import { test as setup } from "@playwright/test";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test.local") });

const TEST_USER = {
  id: "e2e-test-user",
  name: "E2E Test User",
  email: "e2e@test.com",
};

const TEST_SESSION = {
  id: "e2e-test-session",
  token: "e2e-test-session-token",
};

setup("authenticate", async ({ page }) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create test user
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified")
       VALUES ($1, $2, $3, true)
       ON CONFLICT (id) DO NOTHING`,
      [TEST_USER.id, TEST_USER.name, TEST_USER.email]
    );

    // Create session that expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO session (id, "userId", "expiresAt", token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET "expiresAt" = $3, token = $4`,
      [TEST_SESSION.id, TEST_USER.id, expiresAt.toISOString(), TEST_SESSION.token]
    );

    // Navigate to app to set cookie domain
    await page.goto("/");

    // Set the BetterAuth session cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: TEST_SESSION.token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Save storage state
    await page.context().storageState({ path: "e2e/.auth/user.json" });
  } finally {
    await pool.end();
  }
});

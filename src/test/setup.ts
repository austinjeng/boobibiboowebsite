import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test.local") });

// Safety check: ensure we're using a test database
const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl.includes("test")) {
  throw new Error(
    `DATABASE_URL does not contain "test" — refusing to run tests against "${dbUrl}". ` +
      "Set DATABASE_URL in .env.test.local to point to a test database."
  );
}

import { Pool } from "pg";
import fs from "fs";
import path from "path";

let testPool: Pool | null = null;

export function getTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return testPool;
}

export async function setupTestDatabase(): Promise<void> {
  const pool = getTestPool();

  // Create BetterAuth tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
      "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
      scope TEXT,
      password TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY NOT NULL,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run application schema
  const schemaPath = path.resolve(process.cwd(), "src/db/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(schemaSql);
}

export async function cleanDatabase(): Promise<void> {
  const pool = getTestPool();
  await pool.query(`
    TRUNCATE
      room_member,
      room,
      bingo_completion,
      bingo_task,
      bingo_card,
      check_in,
      place,
      session,
      account,
      verification,
      "user"
    CASCADE
  `);
}

export async function teardownTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

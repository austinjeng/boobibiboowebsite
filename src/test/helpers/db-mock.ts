import { vi } from "vitest";
import { getTestPool } from "../setup-db";

/**
 * Must be called BEFORE importing any route handlers.
 * Vitest hoists vi.mock calls to the top of the file.
 * Redirects all @/lib/db queries to the test pool.
 */
export function setupDbMock() {
  vi.mock("@/lib/db", () => {
    return {
      pool: {
        query: (...args: unknown[]) => getTestPool().query(...(args as [string, unknown[]])),
      },
      query: async <T>(text: string, params?: unknown[]): Promise<T[]> => {
        const result = await getTestPool().query(text, params);
        return result.rows as T[];
      },
      queryOne: async <T>(text: string, params?: unknown[]): Promise<T | null> => {
        const result = await getTestPool().query(text, params);
        return (result.rows[0] as T) ?? null;
      },
    };
  });
}

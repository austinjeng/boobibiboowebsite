import { Pool } from "pg";

// PostgreSQL connection pool using pg driver
// Use Supabase pooler port 6543 for connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };

// Helper for running queries
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

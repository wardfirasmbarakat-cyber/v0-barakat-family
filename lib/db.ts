import { Pool } from "pg"

// Single shared pool reused across hot reloads in dev.
const globalForDb = globalThis as unknown as { pgPool?: Pool }

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows as T[]
}

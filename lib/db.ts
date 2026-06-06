let pool: any = null
let migrated = false

try {
  if (process.env.DATABASE_URL) {
    const Pool = require("pg").Pool
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
} catch (error) {
  console.warn("Database connection failed, using mock:", error instanceof Error ? error.message : error)
}

const mockQuery = async (sql: string, params?: any[]) => {
  console.log("Mock query (no database):", sql, params)
  return []
}

async function runMigrations() {
  if (migrated || !pool) return
  migrated = true
  try {
    await pool.query(
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'family'`,
    )
  } catch (e) {
    console.warn("Migration warning:", e instanceof Error ? e.message : e)
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  if (!pool) {
    await mockQuery(sql, params)
    return []
  }
  await runMigrations()
  try {
    const result = await pool.query(sql, params)
    return result.rows || []
  } catch (error) {
    console.error("Database query error:", error)
    return []
  }
}

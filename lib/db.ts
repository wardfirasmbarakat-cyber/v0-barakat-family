let pool: any = null

// Try to initialize database connection if DATABASE_URL is set
try {
  if (process.env.DATABASE_URL) {
    const Pool = require("pg").Pool
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
} catch (error) {
  console.warn("Database connection failed, using mock:", error instanceof Error ? error.message : error)
}

// Mock query function for when database is not available
const mockQuery = async (sql: string, params?: any[]) => {
  console.log("Mock query (no database):", sql, params)
  return []
}

export async function query(sql: string, params?: any[]) {
  // If no database connection, use mock
  if (!pool) {
    return mockQuery(sql, params)
  }

  try {
    const result = await pool.query(sql, params)
    return result.rows || []
  } catch (error) {
    console.error("Database query error:", error)
    return []
  }
}

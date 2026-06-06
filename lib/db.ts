// ─── In-memory store (used when DATABASE_URL is not set) ─────────────────────

type TxnRow = {
  id: string
  type: string
  description: string
  amount: number
  category: string
  source: string
  added_by: string
  created_at: string
}

type MsgRow = {
  id: string
  from_member: string
  to_member: string
  text: string
  read_by_ward: boolean
  created_at: string
}

const memTxns = new Map<string, TxnRow>()
const memMsgs = new Map<string, MsgRow>()

function memQuery(sql: string, params: any[] = []): any[] {
  const s = sql.trim()

  // ── transactions ──────────────────────────────────────────────────────────
  if (s.startsWith("INSERT INTO transactions")) {
    memTxns.set(params[0], {
      id: params[0], type: params[1], description: params[2],
      amount: Number(params[3]), category: params[4],
      added_by: params[5], source: params[6] ?? "family",
      created_at: new Date().toISOString(),
    })
    return []
  }
  if (s.startsWith("DELETE FROM transactions WHERE id")) {
    memTxns.delete(params[0])
    return []
  }
  if (s.startsWith("DELETE FROM transactions")) {
    memTxns.clear()
    return []
  }
  if (s.startsWith("SELECT") && s.includes("FROM transactions")) {
    const rows = [...memTxns.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
    if (params[0] && s.includes("WHERE id")) return rows.filter((r) => r.id === params[0])
    return rows
  }

  // ── messages ──────────────────────────────────────────────────────────────
  if (s.startsWith("INSERT INTO messages")) {
    memMsgs.set(params[0], {
      id: params[0], from_member: params[1], to_member: params[2],
      text: params[3], read_by_ward: true,
      created_at: new Date().toISOString(),
    })
    return []
  }
  if (s.startsWith("UPDATE messages SET read_by_ward")) {
    for (const [id, msg] of memMsgs)
      if (msg.to_member === params[0]) memMsgs.set(id, { ...msg, read_by_ward: true })
    return []
  }
  if (s.startsWith("DELETE FROM messages")) {
    memMsgs.clear()
    return []
  }
  if (s.startsWith("SELECT") && s.includes("FROM messages")) {
    const rows = [...memMsgs.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
    if (params[0] && s.includes("OR to_member"))
      return rows.filter((r) => r.to_member === params[0] || r.to_member === "Everyone")
    return rows
  }

  return []
}

// ─── PostgreSQL pool (used when DATABASE_URL is set) ─────────────────────────

let pool: any = null
let migrated = false

try {
  if (process.env.DATABASE_URL) {
    const Pool = require("pg").Pool
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
} catch (error) {
  console.warn("pg unavailable, using in-memory store:", error instanceof Error ? error.message : error)
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
  if (!pool) return memQuery(sql, params ?? []) as T[]
  await runMigrations()
  try {
    const result = await pool.query(sql, params)
    return result.rows || []
  } catch (error) {
    console.error("Database query error:", error)
    return []
  }
}

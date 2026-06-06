"use server"

import { query } from "@/lib/db"
import { getCurrentMember, setSession, clearSession } from "@/lib/session"
import { MEMBERS, type BusinessSource } from "@/lib/members"

export type TxnSource = "family" | BusinessSource

export type Txn = {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  source: TxnSource
  addedBy: string
  createdAt: string
}

export type Msg = {
  id: string
  from: string
  to: string
  text: string
  readByWard: boolean
  createdAt: string
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export async function login(email: string, password: string) {
  const member = MEMBERS.find((m) => m.email === email.trim().toLowerCase())
  if (!member) return { ok: false as const, error: "Email not found." }
  if (member.password !== password) return { ok: false as const, error: "Wrong password." }
  await setSession(member.name)
  return { ok: true as const }
}

export async function loginByName(name: string) {
  const member = MEMBERS.find((m) => m.name === name)
  if (!member) return { ok: false as const, error: "Unknown member." }
  await setSession(member.name)
  return { ok: true as const }
}

export async function logout() {
  await clearSession()
  return { ok: true as const }
}

export async function addTransaction(input: {
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  source?: TxnSource
}) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")

  const source: TxnSource = input.source ?? "family"

  // Check business access
  if (source !== "family") {
    const memberFull = MEMBERS.find((m) => m.name === me.name)
    if (me.role !== "admin" && !memberFull?.businessAccess.includes(source as BusinessSource)) {
      throw new Error("Unauthorized for this entity")
    }
  }

  const desc = input.description.trim()
  if (!desc) throw new Error("Description required")
  if (!(input.amount > 0)) throw new Error("Invalid amount")

  const id = genId()
  await query(
    `INSERT INTO transactions (id, type, description, amount, category, added_by, source) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.type, desc, input.amount, input.category, me.name, source],
  )
  return { ok: true as const }
}

export async function deleteTransaction(id: string) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")

  if (me.role === "admin") {
    await query(`DELETE FROM transactions WHERE id = $1`, [id])
  } else {
    // Non-admin can delete own transactions; business managers can delete in their entities
    const rows = await query<{ added_by: string; source: string }>(
      `SELECT added_by, source FROM transactions WHERE id = $1`,
      [id],
    )
    if (rows.length === 0) return { ok: true as const }
    const row = rows[0]
    const memberFull = MEMBERS.find((m) => m.name === me.name)
    const canManage =
      row.added_by === me.name ||
      (row.source !== "family" && memberFull?.businessAccess.includes(row.source as BusinessSource))
    if (!canManage) throw new Error("Unauthorized")
    await query(`DELETE FROM transactions WHERE id = $1`, [id])
  }
  return { ok: true as const }
}

export async function sendMessage(to: string, text: string) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  if (me.name !== "Ward") throw new Error("Unauthorized")
  const t = text.trim()
  if (!t) throw new Error("Empty message")
  const id = genId()
  await query(
    `INSERT INTO messages (id, from_member, to_member, text, read_by_ward) VALUES ($1,$2,$3,$4,true)`,
    [id, "Ward", to, t],
  )
  return { ok: true as const }
}

export async function markRead(recipient: string) {
  const me = await getCurrentMember()
  if (!me || me.name !== "Ward") throw new Error("Unauthorized")
  await query(`UPDATE messages SET read_by_ward = true WHERE to_member = $1`, [recipient])
  return { ok: true as const }
}

export async function clearAllTransactions() {
  const me = await getCurrentMember()
  if (!me || me.role !== "admin") throw new Error("Unauthorized")
  await query(`DELETE FROM transactions WHERE true`)
  return { ok: true as const }
}

export async function clearAllMessages() {
  const me = await getCurrentMember()
  if (!me || me.role !== "admin") throw new Error("Unauthorized")
  await query(`DELETE FROM messages WHERE true`)
  return { ok: true as const }
}

export type Recurring = {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  source: TxnSource
  addedBy: string
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  nextDue: string
  createdAt: string
}

export async function getRecurring(): Promise<Recurring[]> {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  const rows = await query<{
    id: string; type: string; description: string; amount: string; category: string;
    source: string; added_by: string; frequency: string; next_due: string; created_at: string
  }>(`SELECT * FROM recurring ORDER BY next_due`)
  return rows.map((r) => ({
    id: r.id,
    type: r.type as "income" | "expense",
    description: r.description,
    amount: Number(r.amount),
    category: r.category,
    source: (r.source ?? "family") as TxnSource,
    addedBy: r.added_by,
    frequency: r.frequency as Recurring["frequency"],
    nextDue: r.next_due,
    createdAt: r.created_at,
  }))
}

export async function addRecurring(input: {
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  source?: TxnSource
  frequency: Recurring["frequency"]
  nextDue: string
}) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  const desc = input.description.trim()
  if (!desc) throw new Error("Description required")
  if (!(input.amount > 0)) throw new Error("Invalid amount")
  const id = genId()
  await query(
    `INSERT INTO recurring (id, type, description, amount, category, added_by, source, frequency, next_due) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, input.type, desc, input.amount, input.category, me.name, input.source ?? "family", input.frequency, input.nextDue],
  )
  return { ok: true as const }
}

export async function deleteRecurring(id: string) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  await query(`DELETE FROM recurring WHERE id = $1`, [id])
  return { ok: true as const }
}

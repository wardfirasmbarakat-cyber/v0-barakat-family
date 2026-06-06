"use server"

import { query } from "@/lib/db"
import { getCurrentMember, setSession, clearSession } from "@/lib/session"
import { MEMBERS } from "@/lib/members"

export type Txn = {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
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
}) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  const desc = input.description.trim()
  if (!desc) throw new Error("Description required")
  if (!(input.amount > 0)) throw new Error("Invalid amount")
  const id = genId()
  await query(
    `INSERT INTO transactions (id, type, description, amount, category, added_by) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, input.type, desc, input.amount, input.category, me.name],
  )
  return { ok: true as const }
}

export async function deleteTransaction(id: string) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  // Admin can delete any; members can delete only their own.
  if (me.role === "admin") {
    await query(`DELETE FROM transactions WHERE id = $1`, [id])
  } else {
    await query(`DELETE FROM transactions WHERE id = $1 AND added_by = $2`, [id, me.name])
  }
  return { ok: true as const }
}

export async function sendMessage(to: string, text: string) {
  const me = await getCurrentMember()
  if (!me) throw new Error("Unauthorized")
  // Only Ward sends messages in this app.
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

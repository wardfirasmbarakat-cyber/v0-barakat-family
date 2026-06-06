import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentMember } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const me = await getCurrentMember()
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const txnRows = await query<{
    id: string
    type: "income" | "expense"
    description: string
    amount: string
    category: string
    added_by: string
    created_at: string
  }>(
    `SELECT id, type, description, amount, category, added_by, created_at FROM transactions ORDER BY created_at ASC`,
  )

  const transactions = txnRows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description,
    amount: Number(r.amount),
    category: r.category,
    addedBy: r.added_by,
    createdAt: r.created_at,
  }))

  let messages: any[] = []
  if (me.name === "Ward") {
    const rows = await query<{
      id: string
      from_member: string
      to_member: string
      text: string
      read_by_ward: boolean
      created_at: string
    }>(`SELECT id, from_member, to_member, text, read_by_ward, created_at FROM messages ORDER BY created_at ASC`)
    messages = rows.map((r) => ({
      id: r.id,
      from: r.from_member,
      to: r.to_member,
      text: r.text,
      readByWard: r.read_by_ward,
      createdAt: r.created_at,
    }))
  } else {
    // Members only see messages addressed to them or to Everyone.
    const rows = await query<{
      id: string
      from_member: string
      to_member: string
      text: string
      created_at: string
    }>(
      `SELECT id, from_member, to_member, text, created_at FROM messages WHERE to_member = $1 OR to_member = 'Everyone' ORDER BY created_at ASC`,
      [me.name],
    )
    messages = rows.map((r) => ({
      id: r.id,
      from: r.from_member,
      to: r.to_member,
      text: r.text,
      readByWard: true,
      createdAt: r.created_at,
    }))
  }

  return NextResponse.json({
    me: { name: me.name, role: me.role },
    transactions,
    messages,
  })
}

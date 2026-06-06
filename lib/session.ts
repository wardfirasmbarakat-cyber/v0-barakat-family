import "server-only"
import { cookies } from "next/headers"
import { MEMBERS, type Member } from "./members"

const COOKIE = "barakat_session"

// Simple roster-based session: the cookie stores the member name, signed with a
// shared secret so it can't be forged client-side.
function secret() {
  return process.env.BETTER_AUTH_SECRET || process.env.DATABASE_URL || "barakat-fallback-secret"
}

async function sign(value: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value))
  return Buffer.from(new Uint8Array(sig)).toString("base64url")
}

export async function createSessionToken(name: string): Promise<string> {
  const sig = await sign(name)
  return `${name}.${sig}`
}

async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const idx = token.lastIndexOf(".")
  if (idx < 0) return null
  const name = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = await sign(name)
  if (sig !== expected) return null
  return name
}

export async function setSession(name: string) {
  const token = await createSessionToken(name)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getCurrentMember(): Promise<Member | null> {
  const store = await cookies()
  const name = await verifyToken(store.get(COOKIE)?.value)
  if (!name) return null
  return MEMBERS.find((m) => m.name === name) ?? null
}

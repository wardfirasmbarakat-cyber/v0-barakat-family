import { cookies } from 'next/headers'
import { MEMBERS } from '@/lib/members'

async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const idx = token.lastIndexOf('.')
  if (idx < 0) return null
  const name = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const enc = new TextEncoder()
  const secret = process.env.BETTER_AUTH_SECRET || process.env.DATABASE_URL || 'barakat-fallback-secret'
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const expected = await crypto.subtle.sign('HMAC', key, enc.encode(name))
    const expectedSig = Buffer.from(new Uint8Array(expected)).toString('base64url')
    if (sig !== expectedSig) return null
    return name
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('barakat_session')?.value
    const name = await verifyToken(token)
    if (!name) return Response.json({ member: null })
    const member = MEMBERS.find((m) => m.name === name)
    if (!member) return Response.json({ member: null })
    return Response.json({
      member: {
        name: member.name,
        role: member.role,
        color: member.color,
        textColor: member.textColor,
        initials: member.initials,
        businessAccess: member.businessAccess,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return Response.json({ member: null })
  }
}

import { cookies } from 'next/headers'
import { MEMBERS } from '@/lib/members'

async function createSessionToken(name: string): Promise<string> {
  const enc = new TextEncoder()
  const secret = process.env.BETTER_AUTH_SECRET || process.env.DATABASE_URL || 'barakat-fallback-secret'
  
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(name))
  return `${name}.${Buffer.from(new Uint8Array(sig)).toString('base64url')}`
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    let member
    
    // Login by name or by email+password
    if (name) {
      member = MEMBERS.find((m) => m.name === name)
    } else if (email && password) {
      member = MEMBERS.find((m) => m.email === email.toLowerCase().trim())
      if (member && member.password !== password) {
        return Response.json({ ok: false, error: 'Wrong password.' }, { status: 401 })
      }
    }

    if (!member) {
      return Response.json({ ok: false, error: 'Member not found.' }, { status: 401 })
    }

    // Create session token
    const token = await createSessionToken(member.name)
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('barakat_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return Response.json({
      ok: true,
      member: {
        name: member.name,
        role: member.role,
        color: member.color,
        textColor: member.textColor,
        initials: member.initials,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}

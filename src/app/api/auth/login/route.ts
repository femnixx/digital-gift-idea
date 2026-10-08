import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUserFromNeonAuth, ensureProfileExists } from '@/lib/neon/auth'
import jwt from 'jsonwebtoken'

const NEON_AUTH_JWKS_URL = process.env.NEON_AUTH_JWKS_URL || process.env.NEXT_PUBLIC_NEON_AUTH_JWKS_URL || ''

function getIssuer() {
  const url = NEON_AUTH_JWKS_URL || ''
  const match = url.match(/https?:\/\/([^\/]+)\//)
  if (!match) throw new Error('Missing NEON_AUTH_JWKS_URL')
  return match[1]
}

async function verifyNeonAuthToken(token: string) {
  try {
    if (!NEON_AUTH_JWKS_URL) return null
    const decoded = jwt.decode(token, { complete: true }) as any
    if (!decoded?.payload) return null
    const jwks = await fetch(NEON_AUTH_JWKS_URL).then((res) => res.json())
    const keys = jwks.keys || []
    const key = keys.find((k: any) => k.kid === decoded.header.kid)
    if (!key) return null
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.x.replace(/_/g, '/').replace(/-/g, '+')}\n-----END PUBLIC KEY-----`
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'ES256'],
      issuer: getIssuer(),
      audience: process.env.NEON_AUTH_AUDIENCE || 'neondb',
    }) as any
    return payload.sub as string
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const neonAuthEndpoint = process.env.NEON_AUTH_ENDPOINT
    if (!neonAuthEndpoint) {
      return NextResponse.json({ error: 'NEON_AUTH_ENDPOINT is not configured' }, { status: 500 })
    }

    const res = await fetch(`${neonAuthEndpoint}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      return NextResponse.json({ error: data.error || 'Login failed' }, { status: res.status })
    }

    const data = await res.json()
    const token = data.access_token || data.token
    if (!token) {
      return NextResponse.json({ error: 'Login succeeded but no token was returned' }, { status: 500 })
    }

    const userId = await verifyNeonAuthToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid login token' }, { status: 401 })
    }

    const user = await getOrCreateUserFromNeonAuth({
      sub: userId,
      email,
    })

    await ensureProfileExists(user.id, user.name || user.email)

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

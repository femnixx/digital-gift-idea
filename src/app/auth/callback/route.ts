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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('neon_auth_token')?.value || ''
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=no_token', request.url))
    }

    const userId = await verifyNeonAuthToken(token)
    if (!userId) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const user = await getOrCreateUserFromNeonAuth({
      sub: userId,
    })

    await ensureProfileExists(user.id, user.name || user.email)

    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    response.cookies.delete('neon_auth_token')
    return response
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}

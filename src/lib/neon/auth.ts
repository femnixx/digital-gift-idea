'use server'

import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing NEON_DATABASE_URL')

export const sql = neon(connectionString)

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Session {
  user: User
  token: string
}

const NEON_AUTH_JWKS_URL = process.env.NEON_AUTH_JWKS_URL || process.env.NEXT_PUBLIC_NEON_AUTH_JWKS_URL || ''
const NEON_AUTH_ISSUER = process.env.NEON_AUTH_ISSUER || ''
const NEON_AUTH_AUDIENCE = process.env.NEON_AUTH_AUDIENCE || ''

function getNeonAuthIssuer(): string {
  if (!NEON_AUTH_ISSUER) {
    const url = NEON_AUTH_JWKS_URL || ''
    const match = url.match(/https?:\/\/([^\/]+)\//)
    if (!match) throw new Error('Missing NEON_AUTH_ISSUER or NEON_AUTH_JWKS_URL')
    return match[1]
  }
  return NEON_AUTH_ISSUER
}

export async function verifyNeonAuthToken(token: string): Promise<User | null> {
  try {
    if (!NEON_AUTH_JWKS_URL) {
      throw new Error('NEON_AUTH_JWKS_URL is not configured')
    }

    const decoded = jwt.decode(token, { complete: true }) as any
    if (!decoded?.payload) return null

    const jwks = await fetch(NEON_AUTH_JWKS_URL).then((res) => res.json())
    const keys = jwks.keys || []
    const key = keys.find((k: any) => k.kid === decoded.header.kid)

    if (!key) {
      throw new Error('Unable to find matching JWK')
    }

    const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.x.replace(/_/g, '/').replace(/-/g, '+')}\n-----END PUBLIC KEY-----`
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'ES256'],
      issuer: getNeonAuthIssuer(),
      audience: NEON_AUTH_AUDIENCE || 'neondb',
    }) as any

    const userId = payload.sub as string
    if (!userId) return null

    const result = await sql`select id, email, name, avatar_url, created_at, updated_at from users where id = ${userId} limit 1`
    return (result[0] as User) || null
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization') || ''
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i)
  const token = bearerMatch?.[1] || ''

  if (!token) return null
  return verifyNeonAuthToken(token)
}

export async function getOrCreateUserFromNeonAuth(payload: {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}): Promise<User> {
  const existing = await sql`select id, email, name, avatar_url, created_at, updated_at from users where id = ${payload.sub} limit 1`

  if (existing.length > 0) {
    const user = existing[0] as User
    const patch: Partial<User> = {}
    if (payload.name && payload.name !== user.name) patch.name = payload.name
    if (payload.picture && payload.picture !== user.avatar_url) patch.avatar_url = payload.picture
    if (Object.keys(patch).length > 0) {
      const updated = await sql`
        update users set name = ${patch.name || user.name}, avatar_url = ${patch.avatar_url || user.avatar_url}, updated_at = now()
        where id = ${user.id} returning id, email, name, avatar_url, created_at, updated_at
      `
      return updated[0] as User
    }
    return user
  }

  const result = await sql`
    insert into users (id, email, password_hash, name, avatar_url, created_at, updated_at)
    values (${payload.sub}, ${(payload.email || '').toLowerCase()}, null::text, ${payload.name || null}, ${payload.picture || null}, now(), now())
    returning id, email, name, avatar_url, created_at, updated_at
  `
  return result[0] as User
}

export async function ensureProfileExists(userId: string, displayName: string) {
  try {
    await sql`insert into profiles (id, display_name, created_at, updated_at) values (${userId}, ${displayName}, now(), now())`
  } catch {
    // ignore duplicate
  }
}
'use server'

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose'
import { ADMIN_USER_ID, SESSION_MAX_AGE_DAYS } from '@/lib/constants'
import { resolveConnectionString } from '@/lib/neon/connection'

const connectionString = resolveConnectionString()
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

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET)
const JWT_EXPIRY = `${SESSION_MAX_AGE_DAYS}d`

const NEON_AUTH_JWKS_URL = process.env.NEON_AUTH_JWKS_URL || process.env.NEXT_PUBLIC_NEON_AUTH_JWKS_URL || ''
const NEON_AUTH_ISSUER = process.env.NEON_AUTH_ISSUER || ''
const NEON_AUTH_AUDIENCE = process.env.NEON_AUTH_AUDIENCE || ''

// Cached JWKS so the Neon Auth fallback does not fetch the key set per request.
let neonAuthJwks: ReturnType<typeof createRemoteJWKSet> | null = null
function getNeonAuthJwks() {
  if (!neonAuthJwks) {
    neonAuthJwks = createRemoteJWKSet(new URL(NEON_AUTH_JWKS_URL))
  }
  return neonAuthJwks
}

function getNeonAuthIssuer(): string {
  if (!NEON_AUTH_ISSUER) {
    const url = NEON_AUTH_JWKS_URL || ''
    const match = url.match(/https?:\/\/([^\/]+)\//)
    if (!match) throw new Error('Missing NEON_AUTH_ISSUER or NEON_AUTH_JWKS_URL')
    return match[1]
  }
  return NEON_AUTH_ISSUER
}

/**
 * Public self-service account primitives.
 *
 * Visitors sign up and sign in themselves, with no admin approval. Passwords are
 * hashed with bcrypt; only the hash is ever stored. The admin account is
 * separate and is not reachable through these functions.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await sql`
    select id, email, name, avatar_url, password_hash, created_at, updated_at
    from users where email = ${email.toLowerCase()} limit 1
  `
  return (result[0] as unknown as (User & { password_hash: string })) || null
}

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const existing = await sql`select id from users where email = ${email.toLowerCase()} limit 1`
  if (existing.length > 0) {
    throw new Error('Email already registered')
  }

  const passwordHash = await hashPassword(password)
  const result = await sql`
    insert into users (email, password_hash, name, created_at, updated_at)
    values (${email.toLowerCase()}, ${passwordHash}, ${name || null}, now(), now())
    returning id, email, name, avatar_url, created_at, updated_at
  `
  return result[0] as unknown as User
}

export async function getUserById(id: string): Promise<User | null> {
  // Normalize the legacy 'admin' alias to the canonical UUID. Old sessions minted
  // before the admin account had a UUID carried sub='admin'; without this they
  // would silently fail verification.
  const resolvedId = id === 'admin' ? ADMIN_USER_ID : id
  const result = await sql`select id, email, name, avatar_url, created_at, updated_at from users where id = ${resolvedId}`
  return (result[0] as unknown as User) || null
}

export async function updateUser(id: string, patch: Partial<Pick<User, 'name' | 'avatar_url'>>): Promise<User | null> {
  const result = await sql`
    update users set name = ${patch.name}, avatar_url = ${patch.avatar_url}, updated_at = now()
    where id = ${id} returning id, email, name, avatar_url, created_at, updated_at
  `
  return (result[0] as unknown as User) || null
}

export async function createSession(userId: string): Promise<string> {
  // The jti makes each token unique. Without it two sign-ins inside the same
  // second produce an identical JWT (sub/typ/iat/exp are the only claims and iat
  // has one-second granularity), which then collides on the sessions primary key
  // and fails the insert with a duplicate-key error.
  const token = await new SignJWT({ sub: userId, typ: 'session', jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET_KEY)

  await sql`insert into sessions (token, user_id, created_at, expires_at) values (${token}, ${userId}, now(), now() + ${SESSION_MAX_AGE_DAYS} * interval '1 day')`
  return token
}

export async function verifySession(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    if (payload.typ !== 'session') return null
    const result = await sql`select user_id, expires_at from sessions where token = ${token} and expires_at > now()`
    if (result.length === 0) return null
    return getUserById(payload.sub as string)
  } catch {
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  await sql`delete from sessions where token = ${token}`
}

export async function refreshSession(oldToken: string): Promise<string | null> {
  const session = await verifySession(oldToken)
  if (!session) return null
  await deleteSession(oldToken)
  return createSession(session.id)
}

export async function verifyNeonAuthToken(token: string): Promise<string | null> {
  try {
    if (!NEON_AUTH_JWKS_URL) {
      return null
    }

    const { payload } = await jwtVerify(token, getNeonAuthJwks(), {
      algorithms: ['RS256', 'ES256'],
      issuer: getNeonAuthIssuer(),
      audience: NEON_AUTH_AUDIENCE || 'neondb',
    })

    const userId = payload.sub as string
    if (!userId) return null

    return userId
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization') || ''
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i)
  const token = bearerMatch?.[1] || ''

  if (!token) {
    const cookie = request.headers.get('cookie') || ''
    const match = cookie.match(/session=([^;]+)/)
    if (match) {
      const localUser = await verifySession(match[1])
      if (localUser) return localUser
      const userId = await verifyNeonAuthToken(match[1])
      if (!userId) return null
      return getUserById(userId)
    }
    return null
  }

  const userId = await verifyNeonAuthToken(token)
  if (!userId) return null
  return getUserById(userId)
}

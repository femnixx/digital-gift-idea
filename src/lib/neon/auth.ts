'use server'

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing NEON_DATABASE_URL')

export const sql = neon(connectionString, { fullResults: true })

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const JWT_EXPIRY = '7d'

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const existing = await sql`select id from users where email = ${email.toLowerCase()}`
  if (existing.rows.length > 0) {
    throw new Error('Email already registered')
  }
  const passwordHash = await hashPassword(password)
  const result = await sql`
    insert into users (email, password_hash, name, created_at, updated_at)
    values (${email.toLowerCase()}, ${passwordHash}, ${name || null}, now(), now())
    returning id, email, name, avatar_url, created_at, updated_at
  `
  return result.rows[0] as User
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await sql`select * from users where email = ${email.toLowerCase()}`
  return result.rows[0] || null
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`select id, email, name, avatar_url, created_at, updated_at from users where id = ${id}`
  return result.rows[0] || null
}

export async function updateUser(id: string, patch: Partial<Pick<User, 'name' | 'avatar_url'>>): Promise<User | null> {
  const result = await sql`
    update users set name = ${patch.name}, avatar_url = ${patch.avatar_url}, updated_at = now()
    where id = ${id} returning id, email, name, avatar_url, created_at, updated_at
  `
  return result.rows[0] || null
}

export async function createSession(userId: string): Promise<string> {
  const token = jwt.sign({ sub: userId, typ: 'session' }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
  await sql`insert into sessions (token, user_id, created_at, expires_at) values (${token}, ${userId}, now(), now() + interval '7 days')`
  return token
}

export async function verifySession(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; typ: string }
    if (payload.typ !== 'session') return null
    const result = await sql`select user_id, expires_at from sessions where token = ${token} and expires_at > now()`
    if (result.rows.length === 0) return null
    return getUserById(payload.sub)
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

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (!match) return null
  try {
    return await verifySession(match[1])
  } catch {
    return null
  }
}
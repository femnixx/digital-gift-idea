import type { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { ADMIN_USER_ID, SESSION_MAX_AGE_SECONDS } from '@/lib/constants'

export { ADMIN_USER_ID }

export const SESSION_COOKIE_NAME = 'session'

/**
 * Resolve the acting user's id from a request.
 *
 * Any authenticated visitor may own rows, so this returns the caller's own id.
 * The admin account resolves to the canonical ADMIN_USER_ID so it satisfies the
 * `uuid` columns on `entries.created_by` and `love_diaries.user_id`.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request)
  if (!user) return null
  return user.id
}

/**
 * Resolve the acting user only if they are the admin account.
 *
 * The admin panel is metrics and health only, so its API routes must reject
 * ordinary visitors. Middleware guards the /admin pages, but defence in depth
 * here means a misconfigured matcher cannot expose the metrics.
 */
export async function requireAdmin(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request)
  if (!user || user.id !== ADMIN_USER_ID) return null
  return ADMIN_USER_ID
}

/**
 * Write the session cookie with the project's single set of security flags and
 * lifetime, so no two routes can diverge on them.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

import type { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { ADMIN_USER_ID, SESSION_MAX_AGE_SECONDS } from '@/lib/constants'

export { ADMIN_USER_ID }

export const SESSION_COOKIE_NAME = 'session'

/**
 * Resolve the acting user's id from a request.
 *
 * The admin account resolves to the canonical ADMIN_USER_ID so it can be stored
 * in `uuid` columns. Previously this mapping was duplicated in each route.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request)
  if (!user) return null
  return user.id
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const user = await getUserFromRequest(request)
  return user?.id === ADMIN_USER_ID
}

/**
 * Write the session cookie with the project's single set of security flags and
 * lifetime, so the login route and the OAuth callback cannot diverge.
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

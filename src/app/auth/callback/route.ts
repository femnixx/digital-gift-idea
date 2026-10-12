import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUserFromNeonAuth, ensureProfileExists, verifyNeonAuthToken } from '@/lib/neon/auth'
import { setSessionCookie } from '@/lib/api/authGuard'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('neon_auth_token')?.value || ''
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login?error=no_token', request.url))
    }

    const userId = await verifyNeonAuthToken(token)
    if (!userId) {
      return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url))
    }

    const user = await getOrCreateUserFromNeonAuth({
      sub: userId,
    })

    await ensureProfileExists(user.id, user.name || user.email, user.email || user.id)

    const response = NextResponse.redirect(new URL('/admin', request.url))
    setSessionCookie(response, token)
    response.cookies.delete('neon_auth_token')
    return response
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(new URL('/admin/login?error=auth_failed', request.url))
  }
}

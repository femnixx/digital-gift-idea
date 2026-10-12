import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { ADMIN_USER_ID } from '@/lib/constants'

const ADMIN_PATHS = ['/admin']

// Public auth surface that must be reachable without a session.
const PUBLIC_ADMIN_PATHS = ['/admin/login']

export const runtime = 'nodejs'

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
    )
  }

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  if (isPublicAdminPath) {
    return applySecurityHeaders(NextResponse.next())
  }

  const isAdminPath = ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  if (!isAdminPath) {
    return applySecurityHeaders(NextResponse.next())
  }

  const sessionCookie = request.cookies.get('session')?.value || ''
  if (!sessionCookie) {
    return redirectToLogin(request)
  }

  const user = await getUserFromRequest(request)
  if (!user || user.id !== ADMIN_USER_ID) {
    return redirectToLogin(request)
  }

  return applySecurityHeaders(NextResponse.next())
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/admin/login', request.url)
  url.searchParams.set('redirect', request.nextUrl.pathname)
  const response = NextResponse.redirect(url)
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/public|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

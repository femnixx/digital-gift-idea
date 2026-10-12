import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { ADMIN_USER_ID } from '@/lib/constants'

// Routes that require the admin account. The admin panel exists purely for
// website metrics and service health, so nothing under here is needed by a
// visitor creating a gift. Both the pages and their API routes are guarded:
// middleware alone does not protect /api/* paths.
const ADMIN_PATHS = ['/admin', '/api/admin']

// Routes that must be reachable without a session. /admin/login is included
// because it matches /admin and would otherwise redirect to itself forever.
const PUBLIC_PATHS = ['/admin/login', '/api/admin/login', '/api/auth/signup', '/api/auth/login', '/api/auth/me', '/api/auth/logout']

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

function matches(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function redirectToAdminLogin(request: NextRequest): NextResponse {
  const url = new URL('/admin/login', request.url)
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return applySecurityHeaders(NextResponse.redirect(url))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never gate the public auth surface on having a session.
  if (matches(pathname, PUBLIC_PATHS)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // The admin panel is metrics and health only, and stays admin-only.
  if (matches(pathname, ADMIN_PATHS)) {
    const sessionCookie = request.cookies.get('session')?.value || ''
    if (!sessionCookie) {
      return redirectToAdminLogin(request)
    }

    const user = await getUserFromRequest(request)
    if (!user || user.id !== ADMIN_USER_ID) {
      return redirectToAdminLogin(request)
    }

    return applySecurityHeaders(NextResponse.next())
  }

  // Everything else, including gift creation and viewing, is public. Individual
  // API routes enforce ownership of the rows they read and write.
  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/public|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

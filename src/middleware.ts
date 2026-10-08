import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'

const PUBLIC_PATHS = ['/login', '/signup', '/auth', '/_next', '/favicon', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (isPublicPath) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value || ''
  if (!sessionCookie) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/public).*)'],
}

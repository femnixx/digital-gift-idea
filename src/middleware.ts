import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { isSupabaseConfigured } from '@/lib/supabase/server'

const PROTECTED_PATHS = ['/admin']
const AUTH_PATHS = ['/login', '/signup', '/auth']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';")
  }

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPath = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected || isAuthPath) {
    return response
  }

  if (!isSupabaseConfigured()) {
    return response
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          const newResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          newResponse.cookies.set({
            name,
            value,
            ...options,
          })
          return newResponse
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          const newResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          newResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
          return newResponse
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

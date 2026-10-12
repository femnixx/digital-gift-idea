import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { deleteSession } from '@/lib/neon/auth'
import { SESSION_COOKIE_NAME, clearSessionCookie } from '@/lib/api/authGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  noStore()

  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value || ''
    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

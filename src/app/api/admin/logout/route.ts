import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/neon/auth'
import { SESSION_COOKIE_NAME, clearSessionCookie } from '@/lib/api/authGuard'

function readSessionToken(request: NextRequest): string {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || ''
}

export async function POST(request: NextRequest) {
  try {
    const token = readSessionToken(request)
    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

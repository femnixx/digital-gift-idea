import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'

function userFriendlyMessage(code: number, fallback: string): string {
  switch (code) {
    case 400:
      return 'Bad request.'
    case 401:
      return 'You are not authorized.'
    case 403:
      return 'Your account is not allowed to view this.'
    case 404:
      return 'User not found.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return fallback || 'Something went wrong. Please try again.'
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ user: null, error: userFriendlyMessage(401, 'Not authenticated') }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json({ user: null, error: userFriendlyMessage(500, 'Failed to fetch user') }, { status: 500 })
  }
}

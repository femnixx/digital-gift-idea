import { NextRequest, NextResponse } from 'next/server'

function userFriendlyMessage(code: number, fallback: string): string {
  switch (code) {
    case 400:
      return 'Bad request.'
    case 401:
      return 'You are not authorized.'
    case 403:
      return 'Your account is not allowed to sign out.'
    case 404:
      return 'Session not found.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return fallback || 'Something went wrong. Please try again.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value || ''
    if (!token) {
      return NextResponse.json({ success: true })
    }

    const neonAuthEndpoint = process.env.NEON_AUTH_ENDPOINT
    if (neonAuthEndpoint) {
      try {
        await fetch(`${neonAuthEndpoint}/auth/signout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore logout errors
      }
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('session')
    return response
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json({ error: userFriendlyMessage(500, 'Logout failed') }, { status: 500 })
  }
}

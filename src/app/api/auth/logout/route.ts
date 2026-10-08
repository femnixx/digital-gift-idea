import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value || ''
    if (!token) {
      return NextResponse.json({ success: true })
    }

    const neonAuthEndpoint = process.env.NEON_AUTH_ENDPOINT || process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL || ''
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
    return NextResponse.json({ error: 'Logout failed. Please try again.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

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
    return NextResponse.json({ success: true })
  }
}

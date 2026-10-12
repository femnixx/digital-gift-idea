import { NextRequest, NextResponse } from 'next/server'
import { createSession, getUserById } from '@/lib/neon/auth'
import { ADMIN_USER_ID, setSessionCookie } from '@/lib/api/authGuard'
import { recordFailedAttempt, clearFailedAttempts } from '@/lib/api/rateLimit'

const RATE_LIMIT_ACTION = 'admin-login'

interface AdminCredentials {
  username: string
  password: string
}

function getAdminCredentials(): AdminCredentials {
  // Credentials come from the environment. The admin:admin fallback exists only
  // for local development and is refused when running in production.
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (typeof email !== 'string' || typeof password !== 'string') {
      const limited = recordFailedAttempt(request, RATE_LIMIT_ACTION)
      if (limited) return limited
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_USERNAME)) {
      console.error('Admin login attempted in production without ADMIN_USERNAME/ADMIN_PASSWORD configured')
      return NextResponse.json({ error: 'Admin login is not configured' }, { status: 503 })
    }

    const { username, password: expectedPassword } = getAdminCredentials()

    if (email === username && password === expectedPassword) {
      clearFailedAttempts(request, RATE_LIMIT_ACTION)
      const token = await createSession(ADMIN_USER_ID)
      const user = await getUserById(ADMIN_USER_ID)
      const response = NextResponse.json({
        user: { id: ADMIN_USER_ID, email: user?.email || username, name: user?.name || 'Admin' },
      })
      setSessionCookie(response, token)
      return response
    }

    // Only failed attempts are counted, so a legitimate sign-in is never penalised.
    const limited = recordFailedAttempt(request, RATE_LIMIT_ACTION)
    if (limited) return limited
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

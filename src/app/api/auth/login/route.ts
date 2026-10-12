import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { getUserByEmail, verifyPassword, createSession } from '@/lib/neon/auth'
import { setSessionCookie } from '@/lib/api/authGuard'
import { z } from 'zod'
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '@/lib/api/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const RATE_LIMIT_ACTION = 'auth-login'

export async function POST(request: NextRequest) {
  noStore()

  try {
    const body = await request.json().catch(() => null)
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { email, password } = validation.data

    const user = await getUserByEmail(email)
    if (!user) {
      const limited = recordFailedAttempt(request, RATE_LIMIT_ACTION)
      if (limited) return limited
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      const limited = recordFailedAttempt(request, RATE_LIMIT_ACTION)
      if (limited) return limited
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Only failures are counted, so a successful sign-in clears the counter.
    clearFailedAttempts(request, RATE_LIMIT_ACTION)

    const token = await createSession(user.id)
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  noStore()
  clearFailedAttempts(request, 'auth-login')
  return NextResponse.json({ ok: true, service: 'auth-login' })
}

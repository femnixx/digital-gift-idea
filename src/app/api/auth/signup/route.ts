import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { createUser, getUserByEmail, createSession } from '@/lib/neon/auth'
import { setSessionCookie } from '@/lib/api/authGuard'
import { sql } from '@/lib/neon/auth'
import { z } from 'zod'
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '@/lib/api/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
})

const RATE_LIMIT_ACTION = 'auth-signup'

export async function POST(request: NextRequest) {
  noStore()

  try {
    const limited = checkRateLimit(request, RATE_LIMIT_ACTION)
    if (limited) return limited

    const body = await request.json().catch(() => null)
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { email, password, name } = validation.data

    let user
    try {
      user = await createUser(email, password, name)
    } catch (error: any) {
      if (error?.message === 'Email already registered') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      throw error
    }

    // Give the visitor a profile row so gift ownership and display lookups work.
    await sql`
      insert into profiles (id, email, display_name, created_at, updated_at)
      values (${user.id}, ${user.email}, ${name || user.name || user.email}, now(), now())
      on conflict (id) do nothing
    `

    const token = await createSession(user.id)
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    )
    setSessionCookie(response, token)
    return response
  } catch (error) {
    console.error('Signup error:', error)
    recordFailedAttempt(request, RATE_LIMIT_ACTION)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  noStore()
  // Reachability probe used by the health checks and the smoke tests.
  clearFailedAttempts(request, RATE_LIMIT_ACTION)
  return NextResponse.json({ ok: true, service: 'auth-signup' })
}

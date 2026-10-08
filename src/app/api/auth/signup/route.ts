import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, ensureProfileExists, createSession } from '@/lib/neon/auth'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { email, password, name } = validation.data

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const user = await createUser(email, password, name)
    await ensureProfileExists(user.id, user.name || user.email)

    const token = await createSession(user.id)

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Error in signup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

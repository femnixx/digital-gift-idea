import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, ensureProfileExists, createSession, getUserById } from '@/lib/neon/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { email, password } = validation.data

    const userRecord = await getUserByEmail(email)
    if (!userRecord) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const passwordHash = (userRecord as any).password_hash as string | undefined
    if (!passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = await getUserById(userRecord.id)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

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
    console.error('Error in login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

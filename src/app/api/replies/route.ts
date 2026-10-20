import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'

export async function POST(request: NextRequest) {
  noStore()

  try {
    const body = await request.json()
    const { gift_id, message } = body

    if (!gift_id || !message) {
      return NextResponse.json({ error: 'gift_id and message are required' }, { status: 400 })
    }

    const [reply] = await sql`
      insert into replies (gift_id, message)
      values (${gift_id}, ${message})
      returning id, gift_id, message, created_at
    `

    return NextResponse.json({ reply }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to send reply' }, { status: 500 })
  }
}

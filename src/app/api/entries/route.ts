import { NextRequest, NextResponse } from 'next/server'
import { getNeonClient } from '@/lib/neon'
import { z } from 'zod'
import { listEntries, createEntry as repoCreateEntry, slugExists } from '@/lib/repositories/entryRepository'

const createEntrySchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.record(z.unknown()).default({}),
  publish_at: z.string().datetime().optional(),
  unlock_at: z.string().datetime().optional().nullable(),
  unlock_condition: z.enum(['date', 'manual', 'location', 'mood']).optional().nullable(),
  is_published: z.boolean().default(false),
})

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null

  try {
    const client = getNeonClient()
    const userId = Buffer.from(token, 'base64').toString('utf-8').split(':')[0]
    const result = await client.query('SELECT id FROM profiles WHERE id = $1', [userId])
    return result.length > 0 ? userId : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const search = searchParams.get('search')

    const entries = await listEntries({
      created_by: userId,
      type: type || undefined,
      search: search || undefined,
      page,
      limit,
    })

    const totalResult = await listEntries({ created_by: userId, type: type || undefined, search: search || undefined })
    const total = totalResult.length

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { title, type, slug, content, publish_at, unlock_at, unlock_condition, is_published } = validation.data

    const exists = await slugExists(slug)
    if (exists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const entry = await repoCreateEntry({
      title,
      type,
      slug,
      content,
      publish_at,
      unlock_at,
      unlock_condition,
      is_published,
      created_by: userId,
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

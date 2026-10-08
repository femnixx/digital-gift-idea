import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { getEntries, createEntry as dbCreateEntry, getEntriesByType } from '@/lib/neon/db'
import { z } from 'zod'

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const search = searchParams.get('search')

    let entries = await getEntries()

    if (type) {
      entries = entries.filter((e) => e.type === type)
    }
    if (published !== null) {
      entries = entries.filter((e) => e.is_published === (published === 'true'))
    }
    if (search) {
      entries = entries.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    }

    const from = (page - 1) * limit
    const to = from + limit
    const paginated = entries.slice(from, to)

    return NextResponse.json({
      entries: paginated,
      pagination: {
        page,
        limit,
        total: entries.length,
        totalPages: Math.ceil(entries.length / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { title, type, slug, content, publish_at, unlock_at, unlock_condition, is_published } = validation.data

    const existing = await getEntryBySlug(slug)
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const entry = await dbCreateEntry({
      slug,
      title,
      type,
      content: content || {},
      publish_at: publish_at || new Date().toISOString(),
      unlock_at: unlock_at || null,
      unlock_condition: unlock_condition || null,
      is_published: is_published || false,
      is_featured: false,
      view_count: 0,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getEntryBySlug(slug: string) {
  const result = await import('@/lib/neon/db').then((m) => m.getEntryBySlug(slug))
  return result
}

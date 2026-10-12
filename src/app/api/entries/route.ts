import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listEntries, countEntries, createEntry, slugExists } from '@/lib/repositories/entryRepository'
import { getUserIdFromRequest } from '@/lib/api/authGuard'

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

// Valid `type` values for list filtering. The column is a Postgres enum, so an
// unknown value would surface as a 500 rather than an empty result.
const ENTRY_TYPES = ['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note'] as const

function parseEntryType(raw: string | null): string | undefined {
  if (!raw) return undefined
  return (ENTRY_TYPES as readonly string[]).includes(raw) ? raw : undefined
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedPage = parseInt(searchParams.get('page') || '', 10)
    const parsedLimit = parseInt(searchParams.get('limit') || '', 10)
    const type = parseEntryType(searchParams.get('type'))
    const search = searchParams.get('search') || undefined

    const page = Number.isNaN(parsedPage) ? 1 : parsedPage
    const limit = Number.isNaN(parsedLimit) ? 10 : parsedLimit

    const filters = { created_by: userId, type, search }

    // A single count query alongside the page; the previous implementation re-ran
    // listEntries, which capped `total` at the default page size of 10.
    const [entries, total] = await Promise.all([
      listEntries({ ...filters, page, limit }),
      countEntries(filters),
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
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

    const now = new Date().toISOString()
    const entry = await createEntry({
      title,
      type,
      slug,
      content,
      publish_at: publish_at ?? now,
      unlock_at: unlock_at ?? null,
      unlock_condition: unlock_condition ?? null,
      is_published,
      is_featured: false,
      view_count: 0,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
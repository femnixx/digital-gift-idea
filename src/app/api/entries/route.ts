import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { listEntries, countEntries, createEntry, slugExists } from '@/lib/repositories/entryRepository'
import { requireAdmin } from '@/lib/api/authGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createEntrySchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.record(z.unknown()).default({}),
  publish_at: z.string().datetime().optional(),
  unlock_at: z.string().datetime().optional().nullable(),
  unlock_condition: z.enum(['date', 'manual', 'location', 'mood']).optional().nullable(),
  is_published: z.boolean().default(false),
  // Optional lifetime. Omitted or null means the gift is permanent.
  expires_at: z.string().datetime().optional().nullable(),
})

// Valid `type` values for list filtering. The column is a Postgres enum, so an
// unknown value would surface as a 500 rather than an empty result.
const ENTRY_TYPES = ['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note'] as const

function parseEntryType(raw: string | null): string | undefined {
  if (!raw) return undefined
  return (ENTRY_TYPES as readonly string[]).includes(raw) ? raw : undefined
}

/**
 * Every gift on the site, site-wide.
 *
 * This is an admin metrics view, so it is deliberately not scoped to one owner:
 * with anonymous creation there are no owners to scope to.
 */
export async function GET(request: NextRequest) {
  noStore()

  try {
    const adminId = await requireAdmin(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsedPage = parseInt(searchParams.get('page') || '', 10)
    const parsedLimit = parseInt(searchParams.get('limit') || '', 10)
    const type = parseEntryType(searchParams.get('type'))
    const search = searchParams.get('search') || undefined

    const filters = { type, search }
    const [entries, total] = await Promise.all([
      listEntries({ ...filters, page: parsedPage, limit: parsedLimit }),
      countEntries(filters),
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page: 1,
        limit: 10,
        total,
        totalPages: Math.ceil(total / 10) || 1,
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Creates a gift anonymously.
 *
 * No account is needed and nothing is approved by anyone: the backend mints the
 * id and the edit token, and the caller keeps the token to manage the gift.
 * The token is returned exactly once, here, and is not recoverable afterwards.
 */
export async function POST(request: NextRequest) {
  noStore()

  try {
    const body = await request.json().catch(() => null)
    const validation = createEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const {
      title, type, slug, content, publish_at, unlock_at, unlock_condition, is_published, expires_at,
    } = validation.data

    if (await slugExists(slug)) {
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
      expires_at: expires_at ?? null,
      is_published,
      is_featured: false,
      view_count: 0,
      created_by: null,
      created_at: now,
      updated_at: now,
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

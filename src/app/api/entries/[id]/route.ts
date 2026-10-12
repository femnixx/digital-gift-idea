import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { resolveEntryByIdOrSlug, updateEntry, deleteEntry, slugExists } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  content: z.record(z.unknown()).optional(),
  publish_at: z.string().datetime().optional(),
  unlock_at: z.string().datetime().optional().nullable(),
  unlock_condition: z.enum(['date', 'manual', 'location', 'mood']).optional().nullable(),
  // Set to null to make the gift permanent again.
  expires_at: z.string().datetime().optional().nullable(),
  is_published: z.boolean().optional(),
})

/**
 * Ownership is an unguessable edit token, not a session, because there are no
 * accounts. Every failure path returns 404 rather than 403 so a probe cannot
 * tell a real gift from a missing one.
 */
function readToken(request: NextRequest): string {
  return new URL(request.url).searchParams.get('token') || ''
}

const NOT_FOUND = { error: 'Entry not found' } as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore()

  try {
    const { id } = await params
    const entry = await resolveEntryByIdOrSlug(id)

    if (!entry || !authorisedByEditToken(entry, readToken(request))) {
      return NextResponse.json(NOT_FOUND, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore()

  try {
    const { id } = await params
    const entry = await resolveEntryByIdOrSlug(id)

    if (!entry || !authorisedByEditToken(entry, readToken(request))) {
      return NextResponse.json(NOT_FOUND, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const validation = updateEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    // Changing the slug must not collide with another gift.
    if (validation.data.slug && validation.data.slug !== entry.slug) {
      if (await slugExists(validation.data.slug)) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
    }

    const updated = await updateEntry(entry.id, validation.data)
    return NextResponse.json({ entry: updated })
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore()

  try {
    const { id } = await params
    const entry = await resolveEntryByIdOrSlug(id)

    if (!entry || !authorisedByEditToken(entry, readToken(request))) {
      return NextResponse.json(NOT_FOUND, { status: 404 })
    }

    await deleteEntry(entry.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

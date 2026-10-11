import { NextRequest, NextResponse } from 'next/server'
import { getNeonClient } from '@/lib/neon'
import { z } from 'zod'
import { getEntryById, updateEntry as repoUpdateEntry, deleteEntry as repoDeleteEntry, slugExists } from '@/lib/repositories/entryRepository'

const updateEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  content: z.record(z.unknown()).optional(),
  publish_at: z.string().datetime().optional(),
  unlock_at: z.string().datetime().optional().nullable(),
  unlock_condition: z.enum(['date', 'manual', 'location', 'mood']).optional().nullable(),
  is_published: z.boolean().optional(),
})

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null

  try {
    const client = getNeonClient()
    const userId = Buffer.from(token, 'base64').toString('utf-8').split(':')[0]
    const result = await (client as any).query(`SELECT id FROM profiles WHERE id = $1`, [userId])
    return result.rows.length > 0 ? userId : null
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entry = await getEntryById(id)

    if (!entry || entry.created_by !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
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
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const existing = await getEntryById(id)
    if (!existing || existing.created_by !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (validation.data.slug) {
      const exists = await slugExists(validation.data.slug, id)
      if (exists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
    }

    const entry = await repoUpdateEntry(id, validation.data)
    if (!entry) {
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getEntryById(id)

    if (!existing || existing.created_by !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await repoDeleteEntry(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { getEntryBySlug, updateEntry, deleteEntry, getMediaByEntry, getBouquetFlowersByEntry, getPolaroidCardsByEntry, getScratchCardsByEntry, getOpenWhenLettersByEntry, getCoffeeDatesByEntry, getVoiceNotesByEntry } from '@/lib/neon/db'
import { z } from 'zod'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await getEntryBySlug(id)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const [media, bouquetFlowers, polaroidCards, scratchCards, openWhenLetters, coffeeDates, voiceNotes] = await Promise.all([
      getMediaByEntry(entry.id),
      getBouquetFlowersByEntry(entry.id),
      getPolaroidCardsByEntry(entry.id),
      getScratchCardsByEntry(entry.id),
      getOpenWhenLettersByEntry(entry.id),
      getCoffeeDatesByEntry(entry.id),
      getVoiceNotesByEntry(entry.id),
    ])

    return NextResponse.json({
      entry: {
        ...entry,
        media,
        bouquet_flowers: bouquetFlowers,
        polaroid_cards: polaroidCards,
        scratch_cards: scratchCards,
        open_when_letters: openWhenLetters,
        coffee_dates: coffeeDates,
        voice_notes: voiceNotes,
      },
    })
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
    const user = await getUserFromRequest(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const existing = await getEntryBySlug(id)
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (validation.data.slug && validation.data.slug !== id) {
      const slugExists = await getEntryBySlug(validation.data.slug)
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
    }

    const entry = await updateEntry(id, validation.data)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
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
    const user = await getUserFromRequest(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await getEntryBySlug(id)
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await deleteEntry(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

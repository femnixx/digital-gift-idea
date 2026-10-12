import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { createVoiceNote, deleteVoiceNote } from '@/lib/neon/db'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { getUserIdFromRequest } from '@/lib/api/authGuard'
import { z } from 'zod'

const voiceNoteSchema = z.object({
  title: z.string().min(1).max(200),
  media_id: z.string().uuid().optional(),
  duration_seconds: z.number().min(0).max(600).optional(),
  transcript: z.string().nullable().optional(),
  cassette_side: z.enum(['A', 'B']).default('A'),
  waveform_data: z.array(z.number()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await resolveEntryByIdOrSlug(id)
    if (!entry || entry.created_by !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = voiceNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const voiceNote = await createVoiceNote({
      entry_id: entry.id,
      title: validation.data.title,
      media_id: validation.data.media_id || null,
      duration_seconds: validation.data.duration_seconds || null,
      transcript: validation.data.transcript || null,
      waveform_data: validation.data.waveform_data || null,
      cassette_side: validation.data.cassette_side,
    })

    return NextResponse.json({ voice_note: voiceNote }, { status: 201 })
  } catch (error) {
    console.error('Error creating voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The voice note id arrives as a query parameter: the path has no [voiceId]
    // segment. Destructuring a non-existent route param left it undefined, so the
    // delete silently matched no rows.
    const voiceNoteId = new URL(request.url).searchParams.get('id')
    if (!voiceNoteId) {
      return NextResponse.json({ error: 'Voice note ID required' }, { status: 400 })
    }

    const entry = await resolveEntryByIdOrSlug(id)
    if (!entry || entry.created_by !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await deleteVoiceNote(voiceNoteId, entry.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

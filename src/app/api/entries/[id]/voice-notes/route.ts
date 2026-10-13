import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { createVoiceNote, deleteVoiceNote } from '@/lib/neon/db'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'
import { z } from 'zod'

const voiceNoteSchema = z.object({
  title: z.string().min(1).max(200),
  media_id: z.string().uuid().optional(),
  // duration_seconds is an INTEGER column. HTMLMediaElement.duration returns a
  // float like 12.345678, and the driver passes that through to an int4 column
  // as invalid syntax, which surfaced as a 500. Rounding here accepts what a
  // browser actually sends and stores what the column can hold.
  duration_seconds: z
    .number()
    .min(0)
    .max(600)
    .transform((value) => Math.round(value))
    .optional(),
  transcript: z.string().nullable().optional(),
  cassette_side: z.enum(['A', 'B']).default('A'),
  // Nullable, not merely optional: the recorder sends null explicitly when it
  // has no waveform to report, and rejecting it made every save fail with a 400.
  waveform_data: z.array(z.number()).nullable().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await resolveEntryByIdOrSlug(id)
    const token = new URL(request.url).searchParams.get('token') || ''

    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = voiceNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    // A media_id that does not exist violates the foreign key and surfaces as a
    // 500, which tells the caller nothing. Check it up front so a stale or
    // fabricated id gets a legible 400 instead.
    if (validation.data.media_id) {
      const media = await sql`select id from media where id = ${validation.data.media_id} limit 1`
      if (media.length === 0) {
        return NextResponse.json({ error: 'Unknown media_id' }, { status: 400 })
      }
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
    const { id } = await params
    const token = new URL(request.url).searchParams.get('token') || ''

    // The voice note id arrives as a query parameter: the path has no [voiceId]
    // segment. Destructuring a non-existent route param left it undefined, so the
    // delete silently matched no rows.
    const voiceNoteId = new URL(request.url).searchParams.get('id')
    if (!voiceNoteId) {
      return NextResponse.json({ error: 'Voice note ID required' }, { status: 400 })
    }

    const entry = await resolveEntryByIdOrSlug(id)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await deleteVoiceNote(voiceNoteId, entry.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

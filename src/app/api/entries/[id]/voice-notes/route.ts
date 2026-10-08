import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { getEntryBySlug, createVoiceNote, deleteVoiceNote } from '@/lib/neon/db'
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
    const user = await getUserFromRequest(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await getEntryBySlug(id)
    if (!entry) {
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
  { params }: { params: Promise<{ id: string; voiceId: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    const { id, voiceId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await getEntryBySlug(id)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await deleteVoiceNote(voiceId, entry.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

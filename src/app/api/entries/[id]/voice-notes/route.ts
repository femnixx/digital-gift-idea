import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: entry } = await supabase
      .from('entries')
      .select('id, created_by')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = voiceNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const voiceNote = {
      id: crypto.randomUUID(),
      entry_id: id,
      media_id: validation.data.media_id || null,
      title: validation.data.title,
      transcript: validation.data.transcript || null,
      waveform_data: validation.data.waveform_data || null,
      duration_seconds: validation.data.duration_seconds || null,
      cassette_side: validation.data.cassette_side,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('voice_notes')
      .insert(voiceNote)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ voice_note: data }, { status: 201 })
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id, voiceId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: entry } = await supabase
      .from('entries')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!entry || entry.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('voice_notes')
      .delete()
      .eq('id', voiceId)
      .eq('entry_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

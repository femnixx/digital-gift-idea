import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        media (*),
        bouquet_flowers (*),
        polaroid_cards (*),
        scratch_cards (*),
        open_when_letters (*),
        coffee_dates (*),
        voice_notes (*)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry: data })
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateEntrySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check slug uniqueness if changing
    if (validation.data.slug) {
      const { data: slugExists } = await supabase
        .from('entries')
        .select('id')
        .eq('slug', validation.data.slug)
        .neq('id', id)
        .single()

      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
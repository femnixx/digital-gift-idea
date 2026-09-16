import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const interactionSchema = z.object({
  interaction_type: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createClient()
    const { slug } = await params
    const body = await request.json()
    
    const validation = interactionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    // Get entry ID from slug
    const { data: entry } = await supabase
      .from('entries')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('partner_interactions')
      .insert({
        entry_id: entry.id,
        interaction_type: validation.data.interaction_type,
        metadata: validation.data.metadata || {},
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ interaction: data }, { status: 201 })
  } catch (error) {
    console.error('Error recording interaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
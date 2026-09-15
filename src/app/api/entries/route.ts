import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createEntrySchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.record(z.unknown()).default({}),
  publish_at: z.string().datetime().optional(),
  unlock_at: z.string().datetime().optional().nullable(),
  unlock_condition: z.enum(['date', 'manual', 'location', 'mood']).optional().nullable(),
  is_published: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const search = searchParams.get('search')

    let query = supabase
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
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }
    if (published !== null) {
      query = query.eq('is_published', published === 'true')
    }
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      entries: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createEntrySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { title, type, slug, content, publish_at, unlock_at, unlock_condition, is_published } = validation.data

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .insert({
        title,
        type,
        slug,
        content,
        publish_at: publish_at || new Date().toISOString(),
        unlock_at,
        unlock_condition,
        is_published,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
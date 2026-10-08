import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEntryBySlug, getPartnerInteractionsByEntry, createPartnerInteraction } from '@/lib/neon/db'

const interactionSchema = z.object({
  interaction_type: z.enum(['like', 'love', 'laugh', 'cry', 'wow', 'reaction']),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const validation = interactionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const entry = await getEntryBySlug(slug)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const interaction = await createPartnerInteraction({
      entry_id: entry.id,
      interaction_type: validation.data.interaction_type,
      metadata: validation.data.metadata || {},
    })

    return NextResponse.json({ interaction }, { status: 201 })
  } catch (error) {
    console.error('Error recording interaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const entry = await getEntryBySlug(slug)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const interactions = await getPartnerInteractionsByEntry(entry.id)

    return NextResponse.json({ interactions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

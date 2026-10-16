import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REVEAL_TYPES = ['text', 'image', 'letter', 'coupon', 'custom'] as const

/**
 * The content hidden under the foil.
 *
 * Stored as one JSONB column, so the shape is validated here rather than in the
 * column type. `text` is the common case; the others carry a payload the
 * recipient reveals.
 */
const revealSchema = z.object({
  type: z.enum(REVEAL_TYPES),
  content: z.string().max(4000),
  title: z.string().max(200).optional(),
})

const cardSchema = z.object({
  cover_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  cover_image_url: z.string().url().max(2000).nullable().optional(),
  reveal_content: revealSchema,
  scratch_threshold: z.number().min(0.05).max(1).optional(),
})

const replaceSchema = z.object({ card: cardSchema })

/**
 * Scratch cards, one per gift.
 *
 * The customizer edits a single card, so this is a replace like the scrapbook
 * rather than a list, and it runs in one transaction.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore()

  try {
    const { id } = await params
    const token = new URL(request.url).searchParams.get('token') || ''

    const entry = await resolveEntryByIdOrSlug(id)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const result = await sql`
      select id, entry_id, cover_color, cover_image_url, reveal_content, scratch_threshold, created_at
      from scratch_cards where entry_id = ${entry.id} limit 1
    `

    return NextResponse.json({ card: result[0] ?? null })
  } catch (error) {
    console.error('Error fetching scratch card:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore()

  try {
    const { id } = await params
    const token = new URL(request.url).searchParams.get('token') || ''

    const entry = await resolveEntryByIdOrSlug(id)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const validation = replaceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { card } = validation.data
    const threshold = card.scratch_threshold ?? 0.6

    await sql.transaction([
      sql`delete from scratch_cards where entry_id = ${entry.id}`,
      sql`
        insert into scratch_cards (entry_id, cover_color, cover_image_url, reveal_content, scratch_threshold)
        values (${entry.id}, ${card.cover_color}, ${card.cover_image_url ?? null}, ${JSON.stringify(card.reveal_content)}::jsonb, ${threshold})
      `,
    ])

    // Re-read rather than reshape transaction()'s result, whose shape varies with
    // statement count. Reading the wrong element once returned `{"card":[]}` for
    // a card that had in fact been written.
    const rows = await sql`
      select id, entry_id, cover_color, cover_image_url, reveal_content, scratch_threshold, created_at
      from scratch_cards where entry_id = ${entry.id} limit 1
    `

    const saved = rows[0] ?? null

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ card: saved })
  } catch (error) {
    console.error('Error saving scratch card:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

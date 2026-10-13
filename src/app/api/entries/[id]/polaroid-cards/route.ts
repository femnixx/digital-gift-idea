import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TEMPLATES = ['classic_white', 'vintage_sepia', 'polaroid_original', 'minimal_modern', 'scrapbook'] as const
const ORIENTATIONS = ['portrait', 'landscape', 'square'] as const
const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace', 'cursive'] as const
const ALIGNMENTS = ['left', 'center', 'right'] as const

const cardSchema = z.object({
  // A data URL is accepted here and converted to a stored media file by the
  // caller, so the column keeps a durable reference rather than a blob.
  image_url: z.string().min(1).max(8_000_000),
  caption: z.string().max(500).nullable().optional(),
  date_tag: z.string().max(100).nullable().optional(),
  back_note: z.string().max(2000).nullable().optional(),
  hidden_message: z.string().max(2000).nullable().optional(),
  tilt_degrees: z.number().min(-45).max(45).optional(),
  template: z.enum(TEMPLATES).optional(),
  orientation: z.enum(ORIENTATIONS).optional(),
  font_family: z.enum(FONT_FAMILIES).optional(),
  font_size: z.string().regex(/^\d+(\.\d+)?(px|rem|em)$/).optional(),
  font_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  text_alignment: z.enum(ALIGNMENTS).optional(),
  stickers: z.array(z.string().max(40)).max(24).optional(),
})

const replaceSchema = z.object({ cards: z.array(cardSchema).max(100) })

/**
 * Postgres returns DECIMAL as a string ("-6.00"), which makes the JSON shape
 * inconsistent for numeric fields. These are coerced so a client always sees
 * numbers, and an empty sticker array is guaranteed rather than null.
 */
function normaliseCard(row: Record<string, unknown>) {
  return {
    ...row,
    tilt_degrees: row.tilt_degrees === null || row.tilt_degrees === undefined ? 0 : Number(row.tilt_degrees),
    sort_order: Number(row.sort_order ?? 0),
    stickers: Array.isArray(row.stickers) ? row.stickers : [],
  }
}


/**
 * Polaroid decks.
 *
 * The customizer edits a whole deck, so this replaces the set in one
 * transaction, as with the bouquet. Styling columns are persisted alongside the
 * image because the customizer edits them and the public view renders them.
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

    const rows = await sql`
      select id, entry_id, image_url, caption, date_tag, back_note, hidden_message,
             tilt_degrees, sort_order, template, orientation, font_family, font_size,
             font_color, text_alignment, stickers, created_at
      from polaroid_cards
      where entry_id = ${entry.id}
      order by sort_order asc, created_at asc
    `

    return NextResponse.json({ cards: rows.map(normaliseCard) })
  } catch (error) {
    console.error('Error fetching polaroid cards:', error)
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

    const statements: Array<ReturnType<typeof sql>> = [
      sql`delete from polaroid_cards where entry_id = ${entry.id}`,
    ]

    validation.data.cards.forEach((card, index) => {
      statements.push(sql`
        insert into polaroid_cards
          (entry_id, image_url, caption, date_tag, back_note, hidden_message, tilt_degrees,
           sort_order, template, orientation, font_family, font_size, font_color, text_alignment, stickers)
        values
          (${entry.id}, ${card.image_url}, ${card.caption ?? null}, ${card.date_tag ?? null},
           ${card.back_note ?? null}, ${card.hidden_message ?? null}, ${card.tilt_degrees ?? 0},
           ${index}, ${card.template ?? 'classic_white'}, ${card.orientation ?? 'portrait'},
           ${card.font_family ?? 'sans-serif'}, ${card.font_size ?? '16px'},
           ${card.font_color ?? '#000000'}, ${card.text_alignment ?? 'center'},
           ${card.stickers ?? []}::text[])
      `)
    })

    await sql.transaction(statements)

    // Re-read rather than reshape transaction()'s result. Its return varies with
    // statement count and driver version, and slicing it produced an empty list
    // even though the rows were written: the previous version reported zero
    // saved cards while a subsequent load correctly returned two.
    const rows = await sql`
      select id, entry_id, image_url, caption, date_tag, back_note, hidden_message,
             tilt_degrees, sort_order, template, orientation, font_family, font_size,
             font_color, text_alignment, stickers, created_at
      from polaroid_cards
      where entry_id = ${entry.id}
      order by sort_order asc, created_at asc
    `

    const cards = rows.map(normaliseCard)

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Error saving polaroid cards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

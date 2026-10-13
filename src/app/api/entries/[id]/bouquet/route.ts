import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FLOWER_TYPES = ['rose', 'tulip', 'sunflower', 'daisy', 'lily', 'lavender'] as const

/**
 * One flower in an arrangement.
 *
 * position_x and position_y are percentages of the canvas, matching the existing
 * bouquet convention where DigitalBouquet clusters them roughly between 5 and
 * 95. A little bleed past the edges is allowed so a caller can push a flower
 * partly out of frame, but the ceiling is far below the column's DECIMAL(5,2)
 * range on purpose: past 100 percent the value is a pixel coordinate in the
 * wrong unit, which is a client bug worth surfacing as a 400.
 */
const flowerSchema = z.object({
  flower_type: z.enum(FLOWER_TYPES),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  position_x: z.number().min(-10).max(110),
  position_y: z.number().min(-10).max(110),
  rotation: z.number().min(-360).max(360),
  scale: z.number().min(0.1).max(5),
  note: z.string().max(500).nullable().optional(),
  generation_seed: z.number().int().min(0).max(2147483647).optional(),
})

const replaceSchema = z.object({
  flowers: z.array(flowerSchema).max(200),
})

/**
 * Bouquet persistence.
 *
 * The builder produces a whole arrangement at once, so the write is a replace
 * rather than an append: the existing rows are removed and the new set inserted
 * in one transaction, which keeps an interrupted save from leaving a half-updated
 * bouquet behind.
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

    const flowers = await sql`
      select id, flower_type, color, note, position_x, position_y, rotation, scale, sort_order, generation_seed, created_at
      from bouquet_flowers
      where entry_id = ${entry.id}
      order by sort_order asc, created_at asc
    `

    return NextResponse.json({ flowers })
  } catch (error) {
    console.error('Error fetching bouquet flowers:', error)
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

    const { flowers } = validation.data

    // Build one statement per flower. The delete and the inserts run in a single
    // transaction so a failure part-way leaves the previous arrangement intact.
    const statements = [sql`delete from bouquet_flowers where entry_id = ${entry.id}`]

    flowers.forEach((flower, index) => {
      statements.push(sql`
        insert into bouquet_flowers
          (entry_id, flower_type, color, note, position_x, position_y, rotation, scale, sort_order, generation_seed)
        values
          (${entry.id}, ${flower.flower_type}, ${flower.color}, ${flower.note ?? null},
           ${flower.position_x}, ${flower.position_y}, ${flower.rotation}, ${flower.scale},
           ${index}, ${flower.generation_seed ?? null})
      `)
    })

    await sql.transaction(statements)

    // touch the entry so its updated_at reflects the change
    await sql`update entries set updated_at = now() where id = ${entry.id}`

    const saved = await sql`
      select id, flower_type, color, position_x, position_y, rotation, scale, sort_order
      from bouquet_flowers where entry_id = ${entry.id} order by sort_order asc
    `

    return NextResponse.json({ flowers: saved })
  } catch (error) {
    console.error('Error saving bouquet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

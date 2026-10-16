import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  dream_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  location: z.string().max(200).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  media_urls: z.array(z.string().max(2000)).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
  is_achieved: z.boolean().optional(),
  achieved_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
})

const replaceSchema = z.object({
  items: z.array(itemSchema).max(200)
})

function normaliseItem(row: Record<string, unknown>) {
  return {
    ...row,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    sort_order: Number(row.sort_order ?? 0),
    is_achieved: Boolean(row.is_achieved),
    media_urls: Array.isArray(row.media_urls) ? row.media_urls : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
  }
}

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

    const items = await sql`
      select id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at
      from bucket_list
      where entry_id = ${entry.id}
      order by dream_date asc, sort_order asc, created_at asc
    `

    return NextResponse.json({ items: items.map(normaliseItem) })
  } catch (error) {
    console.error('Error fetching bucket list items:', error)
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
      sql`delete from bucket_list where entry_id = ${entry.id}`,
    ]

    validation.data.items.forEach((item, index) => {
      statements.push(sql`
        insert into bucket_list
          (entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at)
        values
          (
            ${entry.id},
            ${item.title},
            ${item.description ?? null},
            ${item.dream_date},
            ${item.location ?? null},
            ${item.latitude ?? null},
            ${item.longitude ?? null},
            ${item.media_urls ?? []}::text[],
            ${item.tags ?? null},
            ${item.is_achieved ?? false},
            ${item.achieved_date ?? null},
            ${item.sort_order ?? index},
            now(),
            now()
          )
      `)
    })

    await sql.transaction(statements)

    const rows = await sql`
      select id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at
      from bucket_list
      where entry_id = ${entry.id}
      order by dream_date asc, sort_order asc, created_at asc
    `

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ items: rows.map(normaliseItem) })
  } catch (error) {
    console.error('Error saving bucket list items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const validation = itemSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const data = validation.data
    const result = await sql`
      insert into bucket_list
        (entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at)
      values
        (
          ${entry.id},
          ${data.title},
          ${data.description ?? null},
          ${data.dream_date},
          ${data.location ?? null},
          ${data.latitude ?? null},
          ${data.longitude ?? null},
          ${data.media_urls ?? []}::text[],
          ${data.tags ?? null},
          ${data.is_achieved ?? false},
          ${data.achieved_date ?? null},
          ${data.sort_order ?? 0},
          now(),
          now()
        )
      returning id, entry_id, title, description, dream_date, location, latitude, longitude, media_urls, tags, is_achieved, achieved_date, sort_order, created_at, updated_at
    `

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ item: normaliseItem(result[0]) }, { status: 201 })
  } catch (error) {
    console.error('Error creating bucket list item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const itemId = new URL(request.url).searchParams.get('item_id')
    if (!itemId) {
      return NextResponse.json({ error: 'item_id parameter required' }, { status: 400 })
    }

    await sql`delete from bucket_list where id = ${itemId} and entry_id = ${entry.id}`

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bucket list item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

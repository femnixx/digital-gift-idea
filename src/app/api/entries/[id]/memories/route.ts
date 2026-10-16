import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const memorySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  memory_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  location: z.string().max(200).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  media_urls: z.array(z.string().max(2000)).max(50).optional(),
  media_types: z.array(z.string().max(20)).max(50).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
  is_milestone: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

const replaceSchema = z.object({
  memories: z.array(memorySchema).max(200)
})

function normaliseMemory(row: Record<string, unknown>) {
  return {
    ...row,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    sort_order: Number(row.sort_order ?? 0),
    is_milestone: Boolean(row.is_milestone),
    media_urls: Array.isArray(row.media_urls) ? row.media_urls : [],
    media_types: Array.isArray(row.media_types) ? row.media_types : [],
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

    const memories = await sql`
      select id, entry_id, title, description, memory_date, location, latitude, longitude, media_urls, media_types, tags, is_milestone, sort_order, created_at, updated_at
      from memories
      where entry_id = ${entry.id}
      order by memory_date asc, sort_order asc, created_at asc
    `

    return NextResponse.json({ memories: memories.map(normaliseMemory) })
  } catch (error) {
    console.error('Error fetching memories:', error)
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
      sql`delete from memories where entry_id = ${entry.id}`,
    ]

    validation.data.memories.forEach((memory, index) => {
      statements.push(sql`
        insert into memories
          (entry_id, title, description, memory_date, location, latitude, longitude, media_urls, media_types, tags, is_milestone, sort_order, created_at, updated_at)
        values
          (
            ${entry.id},
            ${memory.title},
            ${memory.description ?? null},
            ${memory.memory_date},
            ${memory.location ?? null},
            ${memory.latitude ?? null},
            ${memory.longitude ?? null},
            ${memory.media_urls ?? []}::text[],
            ${memory.media_types ?? null},
            ${memory.tags ?? null},
            ${memory.is_milestone ?? false},
            ${memory.sort_order ?? index},
            now(),
            now()
          )
      `)
    })

    await sql.transaction(statements)

    const rows = await sql`
      select id, entry_id, title, description, memory_date, location, latitude, longitude, media_urls, media_types, tags, is_milestone, sort_order, created_at, updated_at
      from memories
      where entry_id = ${entry.id}
      order by memory_date asc, sort_order asc, created_at asc
    `

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ memories: rows.map(normaliseMemory) })
  } catch (error) {
    console.error('Error saving memories:', error)
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
    const validation = memorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const data = validation.data
    const result = await sql`
      insert into memories
        (entry_id, title, description, memory_date, location, latitude, longitude, media_urls, media_types, tags, is_milestone, sort_order, created_at, updated_at)
      values
        (
          ${entry.id},
          ${data.title},
          ${data.description ?? null},
          ${data.memory_date},
          ${data.location ?? null},
          ${data.latitude ?? null},
          ${data.longitude ?? null},
          ${data.media_urls ?? []}::text[],
          ${data.media_types ?? null},
          ${data.tags ?? null},
          ${data.is_milestone ?? false},
          ${data.sort_order ?? 0},
          now(),
          now()
        )
      returning id, entry_id, title, description, memory_date, location, latitude, longitude, media_urls, media_types, tags, is_milestone, sort_order, created_at, updated_at
    `

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ memory: normaliseMemory(result[0]) }, { status: 201 })
  } catch (error) {
    console.error('Error creating memory:', error)
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

    const memoryId = new URL(request.url).searchParams.get('memory_id')
    if (!memoryId) {
      return NextResponse.json({ error: 'memory_id parameter required' }, { status: 400 })
    }

    await sql`delete from memories where id = ${memoryId} and entry_id = ${entry.id}`

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

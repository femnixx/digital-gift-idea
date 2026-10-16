import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { sql } from '@/lib/neon/auth'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { authorisedByEditToken } from '@/lib/api/editToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  media_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  position_x: z.number().int().default(0),
  position_y: z.number().int().default(0),
  width: z.number().int().min(20).max(500).default(120),
  height: z.number().int().min(20).max(500).default(120),
  rotation: z.number().min(0).max(360).default(0),
  scale: z.number().min(0.1).max(3).default(1),
  z_index: z.number().int().min(0).default(0),
  date_tag: z.string().nullable().optional(),
  font_family: z.string().default('serif'),
  font_size: z.string().default('14px'),
  font_color: z.string().default('#374151'),
  text_alignment: z.string().default('center'),
})

const pageSchema = z.object({
  id: z.string().uuid().optional(),
  layout_type: z.string().default('freeform'),
  background_color: z.string().default('#fdf6f0'),
  background_image: z.string().nullable().optional(),
  items: z.array(itemSchema).max(100).default([]),
})

const replaceSchema = z.object({
  pages: z.array(pageSchema).max(10)
})

function normalisePage(row: Record<string, unknown>, items: any[] = []) {
  return {
    id: row.id,
    entry_id: row.entry_id,
    layout_type: row.layout_type,
    background_color: row.background_color,
    background_image: row.background_image,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items,
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

    const pages = await sql`
      select id, entry_id, layout_type, background_color, background_image, created_at, updated_at
      from scrapbook_pages
      where entry_id = ${entry.id}
      order by created_at asc
    `

    const pagesWithItems = []
    for (const page of pages) {
      const items = await sql`
        select * from scrapbook_items where page_id = ${page.id} order by z_index asc, created_at asc
      `
      pagesWithItems.push(normalisePage(page, items as any[]))
    }

    return NextResponse.json({ pages: pagesWithItems })
  } catch (error) {
    console.error('Error fetching scrapbook:', error)
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
    const validation = pageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const data = validation.data
    const page = await sql`
      insert into scrapbook_pages (entry_id, layout_type, background_color, background_image)
      values (
        ${entry.id},
        ${data.layout_type},
        ${data.background_color},
        ${data.background_image || null}
      )
      returning *
    `

    const pageResult = page[0]
    const items: Record<string, any>[] = []

    for (const item of data.items) {
      const result = await sql`
        insert into scrapbook_items
          (page_id, media_id, image_url, caption, position_x, position_y, width, height, rotation, scale, z_index, date_tag, font_family, font_size, font_color, text_alignment)
        values
          (
            ${pageResult.id},
            ${item.media_id || null},
            ${item.image_url || null},
            ${item.caption || null},
            ${item.position_x ?? 0},
            ${item.position_y ?? 0},
            ${item.width ?? 120},
            ${item.height ?? 120},
            ${item.rotation ?? 0},
            ${item.scale ?? 1},
            ${item.z_index ?? 0},
            ${item.date_tag || null},
            ${item.font_family || 'serif'},
            ${item.font_size || '14px'},
            ${item.font_color || '#374151'},
            ${item.text_alignment || 'center'}
          )
        returning *
      `
      items.push(result[0] as any)
    }

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ page: normalisePage(pageResult, items) }, { status: 201 })
  } catch (error) {
    console.error('Error creating scrapbook page:', error)
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

    for (const pageData of validation.data.pages) {
      let pageRow: any

      if (pageData.id && pageData.id.startsWith('new-')) {
        pageRow = await sql`
          insert into scrapbook_pages (id, entry_id, layout_type, background_color, background_image)
          values (gen_random_uuid(), ${entry.id}, ${pageData.layout_type}, ${pageData.background_color}, ${pageData.background_image || null})
          returning *
        `
      } else if (pageData.id) {
        pageRow = await sql`
          update scrapbook_pages
          set layout_type = ${pageData.layout_type}, background_color = ${pageData.background_color}, background_image = ${pageData.background_image || null}, updated_at = now()
          where id = ${pageData.id} and entry_id = ${entry.id}
          returning *
        `
        if (!pageRow.length) {
          pageRow = await sql`
            insert into scrapbook_pages (entry_id, layout_type, background_color, background_image)
            values (${entry.id}, ${pageData.layout_type}, ${pageData.background_color}, ${pageData.background_image || null})
            returning *
          `
        }
      } else {
        pageRow = await sql`
          insert into scrapbook_pages (entry_id, layout_type, background_color, background_image)
          values (${entry.id}, ${pageData.layout_type}, ${pageData.background_color}, ${pageData.background_image || null})
          returning *
        `
      }

      const pageResult = pageRow[0]

      await sql`delete from scrapbook_items where page_id = ${pageResult.id}`

      for (const item of pageData.items) {
        if (item.id && !item.id.startsWith('new-')) {
          await sql`
            update scrapbook_items
            set media_id = ${item.media_id || null},
                image_url = ${item.image_url || null},
                caption = ${item.caption || null},
                position_x = ${item.position_x ?? 0},
                position_y = ${item.position_y ?? 0},
                width = ${item.width ?? 120},
                height = ${item.height ?? 120},
                rotation = ${item.rotation ?? 0},
                scale = ${item.scale ?? 1},
                z_index = ${item.z_index ?? 0},
                date_tag = ${item.date_tag || null},
                font_family = ${item.font_family || 'serif'},
                font_size = ${item.font_size || '14px'},
                font_color = ${item.font_color || '#374151'},
                text_alignment = ${item.text_alignment || 'center'},
                updated_at = now()
            where id = ${item.id}
          `
        } else {
          await sql`
            insert into scrapbook_items
              (page_id, media_id, image_url, caption, position_x, position_y, width, height, rotation, scale, z_index, date_tag, font_family, font_size, font_color, text_alignment)
            values
              (
                ${pageResult.id},
                ${item.media_id || null},
                ${item.image_url || null},
                ${item.caption || null},
                ${item.position_x ?? 0},
                ${item.position_y ?? 0},
                ${item.width ?? 120},
                ${item.height ?? 120},
                ${item.rotation ?? 0},
                ${item.scale ?? 1},
                ${item.z_index ?? 0},
                ${item.date_tag || null},
                ${item.font_family || 'serif'},
                ${item.font_size || '14px'},
                ${item.font_color || '#374151'},
                ${item.text_alignment || 'center'}
              )
          `
        }
      }
    }

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    const pages = await sql`
      select id, entry_id, layout_type, background_color, background_image, created_at, updated_at
      from scrapbook_pages
      where entry_id = ${entry.id}
      order by created_at asc
    `

    const pagesWithItems = []
    for (const page of pages) {
      const items = await sql`
        select * from scrapbook_items where page_id = ${page.id} order by z_index asc, created_at asc
      `
      pagesWithItems.push(normalisePage(page, items as any[]))
    }

    return NextResponse.json({ pages: pagesWithItems })
  } catch (error) {
    console.error('Error saving scrapbook:', error)
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
    if (itemId) {
      await sql`delete from scrapbook_items where id = ${itemId}`
    }

    const pageId = new URL(request.url).searchParams.get('page_id')
    if (pageId) {
      await sql`delete from scrapbook_items where page_id = ${pageId}`
      await sql`delete from scrapbook_pages where id = ${pageId} and entry_id = ${entry.id}`
    }

    await sql`update entries set updated_at = now() where id = ${entry.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scrapbook item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

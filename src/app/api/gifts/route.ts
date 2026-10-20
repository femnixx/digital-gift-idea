import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'
import { generateSlug, sanitizeSlug, isReservedSlug, isValidSlugFormat } from '@/lib/slugs'
import type { WrapStyle } from '@/types/keepsake'

/**
 * POST /api/gifts
 * Create a new gift (draft or publish). Body:
 * { title, recipient_name, type, note, wrap_style, unlock_at, pin, slug?, is_published }
 */
export async function POST(request: NextRequest) {
  noStore()

  try {
    const body = await request.json()
    const {
      title,
      recipient_name,
      type,
      note,
      wrap_style,
      unlock_at,
      pin,
      slug: customSlug,
      is_published = false,
      items = [],
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'title and type are required' }, { status: 400 })
    }

    // Determine slug
    let slug = ''
    let slug_is_custom = false

    if (customSlug) {
      const cleaned = sanitizeSlug(customSlug)
      if (!cleaned || !isValidSlugFormat(cleaned)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase letters, numbers and hyphens (3–40 chars)' },
          { status: 400 }
        )
      }
      if (isReservedSlug(cleaned)) {
        return NextResponse.json({ error: 'This slug is reserved' }, { status: 400 })
      }
      // availability check
      const existing = await sql`select id from gifts where slug = ${cleaned} limit 1`
      if (existing.length) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
      }
      slug = cleaned
      slug_is_custom = true
    } else {
      // auto-generate a long random slug, ensure unique
      for (let i = 0; i < 10; i++) {
        const candidate = generateSlug()
        const existing = await sql`select id from gifts where slug = ${candidate} limit 1`
        if (!existing.length) {
          slug = candidate
          break
        }
      }
      if (!slug) {
        return NextResponse.json({ error: 'Unable to generate unique slug' }, { status: 500 })
      }
    }

    if (!slug) {
      return NextResponse.json({ error: 'Unable to determine slug' }, { status: 500 })
    }

    // Hash PIN if provided
    let pin_hash: string | null = null
    if (pin) {
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      pin_hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }

    const now = new Date().toISOString()
    const status = is_published ? 'published' : 'draft'
    const published_at = is_published ? now : null

    const [gift] = await sql`
      insert into gifts (slug, slug_is_custom, title, recipient_name, type, note, wrap_style, unlock_at, pin_hash, status, is_published, published_at, created_at, updated_at)
      values (${slug}, ${slug_is_custom}, ${title}, ${recipient_name || null}, ${type}, ${note || null}, ${wrap_style ? JSON.stringify(wrap_style) : '{}'}, ${unlock_at || null}, ${pin_hash}, ${status}, ${is_published}, ${published_at}, ${now}, ${now})
      returning id, slug, title, type, status, is_published, created_at
    `

    // Create gift items
    if (Array.isArray(items) && items.length) {
      for (const item of items) {
        await sql`
          insert into gift_items (gift_id, kind, payload_json, position)
          values (${gift.id}, ${item.kind}, ${JSON.stringify(item.payload_json || {})}, ${item.position ?? 0})
        `
      }
    }

    return NextResponse.json(
      {
        gift: {
          id: gift.id,
          slug: gift.slug,
          title: gift.title,
          type: gift.type,
          status: gift.status,
          is_published: gift.is_published,
        },
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/g/${slug}`,
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unable to create gift' }, { status: 500 })
  }
}

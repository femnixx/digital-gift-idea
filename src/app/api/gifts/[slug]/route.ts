import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'
import type { KeepsakeGift } from '@/types/keepsake'

/**
 * Public gift lookup by slug.
 *
 * Returns the gift if it is published and unlocked (not scheduled in the
 * future, or scheduled but already past unlock_at). PIN is never returned to
 * the client — only a boolean `pin_required` so the client knows to prompt.
 * Scheduled gifts that are not yet unlocked return a `locked_until` timestamp
 * instead of contents.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  noStore()

  try {
    const { slug } = await params
    const [gift] = await sql`
      select id, slug, slug_is_custom, title, recipient_name, type, note,
             wrap_style, unlock_at, pin_hash, status, is_published, noindex,
             social_opt_in, published_at, created_at, updated_at
      from gifts
      where slug = ${slug}
      limit 1
    `

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Unpublished / taken down -> friendly 404 (no confirmation it exists)
    if (!gift.is_published || gift.status === 'unpublished') {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Scheduled but not yet unlocked -> return lock info, no contents
    const now = new Date()
    const unlockAt = gift.unlock_at ? new Date(gift.unlock_at) : null
    const locked = unlockAt && unlockAt > now

    // Fetch items only if not locked (contents hidden until unlock)
    let items: any[] = []
    if (!locked) {
      const rows = await sql`
        select id, gift_id, kind, payload, position
        from gift_items
        where gift_id = ${gift.id}
        order by position asc, created_at asc
      `
      items = rows
    }

    return NextResponse.json(
      {
        gift: {
          ...gift,
          pin_required: !!gift.pin_hash,
          locked,
          locked_until: gift.unlock_at || null,
          // Never send the pin hash to the client
          pin_hash: undefined,
        },
        items,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          // Gifts are noindex by default; opt-in via social_opt_in
          ...(!gift.social_opt_in
            ? { 'X-Robots-Tag': 'noindex, nofollow' }
            : {}),
        },
      }
    )
  } catch (err: any) {
    // Table may not exist yet in dev; surface clearly but don't leak internals
    if (err.code === '42P01') {
      return NextResponse.json(
        { error: 'Gift database not initialized. Run the Keepsake migrations.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json(
      { error: 'Unable to load gift' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

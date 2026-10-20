import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'
import { sanitizeSlug, isReservedSlug, isValidSlugFormat } from '@/lib/slugs'

/**
 * GET /api/gifts/check?slug=...
 * Check slug availability and validity.
 */
export async function GET(request: NextRequest) {
  noStore()

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('slug') || ''

  const cleaned = sanitizeSlug(raw)
  if (!cleaned) {
    return NextResponse.json({ valid: false, available: false, error: 'Enter a slug' })
  }
  if (!isValidSlugFormat(cleaned)) {
    return NextResponse.json({ valid: false, available: false, error: 'Use lowercase letters, numbers and hyphens only (3–40 chars)' })
  }
  if (isReservedSlug(cleaned)) {
    return NextResponse.json({ valid: false, available: false, error: 'This slug is reserved' })
  }

  const existing = await sql`select id from gifts where slug = ${cleaned} limit 1`
  return NextResponse.json({
    valid: true,
    available: existing.length === 0,
    slug: cleaned,
    ...(existing.length ? { error: 'Slug already taken' } : {}),
  })
}

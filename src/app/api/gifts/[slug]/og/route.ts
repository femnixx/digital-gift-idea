import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { sql } from '@/lib/neon/auth'

/**
 * Open Graph preview image for a gift: wrapped box + title on paper background.
 * Returns a PNG.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  noStore()

  try {
    const { slug } = await params
    const [gift] = await sql`
      select title from gifts where slug = ${slug} limit 1
    `
    const title = (gift as any)?.title || 'A gift for you'
    const escaped = title.replace(/"/g, '&quot;')

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      .title { font-family: 'Playfair Display', serif; font-weight: 700; fill: #2B2118; font-size: 56px; }
      .sub { font-family: 'Source Serif 4', serif; fill: #5A4A3B; font-size: 24px; }
    </style>
  </defs>
  <rect width="1200" height="630" fill="#F3EBDD" />
  <!-- table surface -->
  <rect y="430" width="1200" height="200" fill="#D9C8AE" />
  <!-- wrapped box -->
  <rect x="430" y="180" width="340" height="260" rx="8" fill="#E7DAC2" stroke="#2B2118" stroke-width="2" />
  <rect x="430" y="180" width="340" height="90" rx="8" fill="#D9C8AE" stroke="#2B2118" stroke-width="2" />
  <!-- ribbon -->
  <rect x="480" y="180" width="40" height="260" fill="#7A1F2B" />
  <rect x="430" y="290" width="340" height="40" fill="#7A1F2B" />
  <!-- wax seal -->
  <circle cx="600" cy="310" r="26" fill="#7A1F2B" stroke="#5a171e" stroke-width="3" />
  <text x="600" y="315" text-anchor="middle" fill="#c9a84e" font-family="serif" font-weight="700" font-size="18">K</text>
  <!-- title text -->
  <text x="600" y="540" text-anchor="middle" class="title">${escaped}</text>
  <text x="600" y="585" text-anchor="middle" class="sub">Keepsake &middot; Open the gift</text>
</svg>
`

    const buffer = Buffer.from(svg)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getEntryBySlug } from '@/lib/neon/db'
import { resolveBaseUrl } from '@/lib/api/baseUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIZE = 512

/**
 * QR code for a gift's public link.
 *
 * The encoded URL is the permanent public path, not a signed link, so the code
 * keeps working forever. Dimensions and margin are bound to a whitelist so a
 * caller cannot force an enormous render.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { searchParams } = new URL(request.url)
    const requestedSize = parseInt(searchParams.get('size') || '', 10)
    const size = Number.isFinite(requestedSize) ? Math.min(Math.max(requestedSize, 64), 1024) : SIZE

    const entry = await getEntryBySlug(slug)
    if (!entry || !entry.is_published) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const url = `${resolveBaseUrl(request)}/daily/${slug}`

    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: { dark: '#0c4a6e', light: '#ffffff' },
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(buffer.byteLength),
        // The payload never changes, so this is safe to cache hard.
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

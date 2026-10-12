import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { getEntryBySlug } from '@/lib/neon/db'
import { getMediaById } from '@/lib/neon/db'
import { downloadMedia } from '@/lib/storage/objectStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Permanent public media access.
 *
 * Storage hands out presigned URLs that expire, and `getMediaUrl` was never
 * called anyway, so uploaded images rendered as nothing. This route is the
 * stable address: it is derived from the entry slug and media id, never
 * expires, and validates ownership on every request before streaming bytes.
 * There is no signed URL to go stale.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  noStore()

  try {
    const { slug, mediaId } = await params

    const entry = await getEntryBySlug(slug)
    if (!entry || !entry.is_published) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const media = await getMediaById(mediaId)
    if (!media || media.entry_id !== entry.id) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const body = await downloadMedia(media.storage_path)
    if (!body || body.byteLength === 0) {
      return NextResponse.json({ error: 'Media not found in storage' }, { status: 404 })
    }

    return new NextResponse(body.slice(), {
      status: 200,
      headers: {
        'Content-Type': media.mime_type || 'application/octet-stream',
        'Content-Length': String(body.byteLength),
        // Public, permanent, but revalidated so a replaced file is picked up.
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error serving public media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const range = request.headers.get('range')

    // An <audio> element seeks by asking for a byte range, and it will not play
    // from a server that ignores it: it gets 200 where it asked for 206, with no
    // Accept-Ranges to say seeking is possible at all. Serving the range keeps
    // playback working for both audio and long images.
    if (range) {
      const parsed = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (parsed) {
        const size = body.byteLength
        const start = parsed[1] === '' ? 0 : Number(parsed[1])
        const end = parsed[2] === '' ? size - 1 : Math.min(Number(parsed[2]), size - 1)

        if (Number.isFinite(start) && start < size && end >= start) {
          return new NextResponse(body.slice(start, end + 1), {
            status: 206,
            headers: {
              'Content-Type': media.mime_type || 'application/octet-stream',
              'Content-Length': String(end - start + 1),
              'Content-Range': `bytes ${start}-${end}/${size}`,
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
          })
        }
      }

      // Unsatisfiable range.
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${body.byteLength}`,
          'Accept-Ranges': 'bytes',
        },
      })
    }

    return new NextResponse(body.slice(), {
      status: 200,
      headers: {
        'Content-Type': media.mime_type || 'application/octet-stream',
        'Content-Length': String(body.byteLength),
        'Accept-Ranges': 'bytes',
        // Public, permanent, but revalidated so a replaced file is picked up.
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error serving public media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

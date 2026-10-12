import { NextRequest, NextResponse } from 'next/server'
import { getMediaById, getMediaByEntry, createMedia as dbCreateMedia, deleteMedia as dbDeleteMedia } from '@/lib/neon/db'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'
import { deleteMedia, uploadMedia } from '@/lib/storage/objectStorage'
import { authorisedByEditToken } from '@/lib/api/editToken'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Media routes are token-guarded, like entry edits: gifts are anonymous, so the
 * unguessable edit token is the only proof of authorship. The token arrives as
 * `?token=`, and a mismatch returns 404 so the route never confirms a gift
 * exists.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entryId = formData.get('entry_id') as string
    const type = formData.get('type') as 'image' | 'audio' | 'video'
    const token = (formData.get('token') as string) || ''

    if (!file || !entryId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entry = await resolveEntryByIdOrSlug(entryId)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    // Keyed by the gift's own id, as required, then the object's UUID.
    const storagePath = `gifts/${entry.id}/${fileName}`

    await uploadMedia(storagePath, file, { contentType: file.type })

    const media = await dbCreateMedia({
      entry_id: entry.id,
      type,
      storage_path: storagePath,
      public_url: null,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      sort_order: 0,
    })

    return NextResponse.json({ media }, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Public, token-free listing: once a gift is published its media is served
 * through the permanent public media route instead.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entry_id')
    const token = searchParams.get('token') || ''

    if (!entryId) {
      return NextResponse.json({ error: 'entry_id required' }, { status: 400 })
    }

    const entry = await resolveEntryByIdOrSlug(entryId)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const media = await getMediaByEntry(entry.id)
    return NextResponse.json({ media }, { status: 200 })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('id')
    const token = searchParams.get('token') || ''

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 })
    }

    // A non-UUID id would reach Postgres's uuid parser and surface as a 500.
    // Treat a malformed id as "not found" so the status stays consistent with a
    // missing one.
    if (!UUID_REGEX.test(mediaId)) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Look the media row up by its own id. This previously called
    // getMediaByEntry(''), which made Postgres reject the empty string as a uuid
    // and returned a 500 without deleting anything.
    const media = await getMediaById(mediaId)
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const entry = await resolveEntryByIdOrSlug(media.entry_id)
    if (!entry || !authorisedByEditToken(entry, token)) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    try {
      // Remove the stored object first so a failed DB delete cannot orphan a
      // row pointing at a missing file.
      await deleteMedia(media.storage_path)
    } catch (error) {
      console.error('Error deleting media from storage:', error)
    }

    await dbDeleteMedia(mediaId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

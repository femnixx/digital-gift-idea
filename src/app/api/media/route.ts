import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/neon/auth'
import { getEntryBySlug, getMediaByEntry, createMedia as dbCreateMedia, deleteMedia } from '@/lib/neon/db'
import { getMediaStore, uploadMedia } from '@/lib/storage/objectStorage'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entryId = formData.get('entry_id') as string
    const type = formData.get('type') as 'image' | 'audio' | 'video'

    if (!file || !entryId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entry = await getEntryBySlug(entryId)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${user.id}/${entryId}/${fileName}`

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entry_id')

    if (!entryId) {
      return NextResponse.json({ error: 'entry_id required' }, { status: 400 })
    }

    const media = await getMediaByEntry(entryId)

    return NextResponse.json({ media }, { status: 200 })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('id')

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 })
    }

    const mediaList = await getMediaByEntry('')
    const media = mediaList.find((m) => m.id === mediaId)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    try {
      await deleteMedia(mediaId)
    } catch {
      // ignore delete error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

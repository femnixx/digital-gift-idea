import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
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

    // Verify entry ownership
    const { data: entry } = await supabase
      .from('entries')
      .select('id')
      .eq('id', entryId)
      .eq('created_by', user.id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${user.id}/${entryId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(storagePath)

    // Save media record
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        entry_id: entryId,
        type,
        storage_path: storagePath,
        public_url: publicUrl,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single()

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }

    return NextResponse.json({ media }, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('id')

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 })
    }

    // Get media info and verify ownership
    const { data: media } = await supabase
      .from('media')
      .select(`
        *,
        entries!inner(created_by)
      `)
      .eq('id', mediaId)
      .single()

    if (!media || media.entries.created_by !== user.id) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete from storage
    await supabase.storage
      .from('media')
      .remove([media.storage_path])

    // Delete record
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
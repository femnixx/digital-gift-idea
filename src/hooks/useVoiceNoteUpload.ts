'use client'

import { useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import type { Media } from '@/types'

export function useVoiceNoteUpload(entryId: string) {
  const [uploading, setUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadAudio = async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)

    if (!isSupabaseConfigured()) {
      try {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const mediaItem: Media = {
          id: `media-${Date.now()}`,
          entry_id: entryId,
          type: 'audio',
          storage_path: '',
          public_url: dataUrl,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          width: null,
          height: null,
          duration_seconds: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
        }

        const storage = DemoDataProvider.getStorage()
        storage.media = storage.media || []
        storage.media.push(mediaItem)
        DemoDataProvider.setStorage(storage)
        setAudioUrl(dataUrl)
        setUploading(false)
        return dataUrl
      } catch (err: any) {
        setError(err.message)
        setUploading(false)
        return null
      }
    }

    const supabase = createClient() as any

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setUploading(false)
        return null
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const storagePath = `${user.id}/${entryId}/${fileName}`

      // @ts-ignore — Supabase storage upload with options
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file, { cacheControl: '3600' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(storagePath)

      // @ts-ignore — Supabase chain method
      const { error: mediaError } = await supabase
        .from('media')
        .insert({
          entry_id: entryId,
          type: 'audio',
          storage_path: storagePath,
          public_url: publicUrl,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single()

      if (mediaError) throw mediaError

      setAudioUrl(publicUrl)
      setUploading(false)
      return publicUrl
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
      return null
    }
  }

  return { uploadAudio, audioUrl, uploading, error }
}

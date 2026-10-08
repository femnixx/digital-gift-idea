'use client'

import { useState } from 'react'
import type { Media } from '@/types'

export function useVoiceNoteUpload(_entryId: string) {
  const [uploading, setUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadAudio = async (_file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)

    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(_file)
      })

      const mediaItem: Media = {
        id: `media-${Date.now()}`,
        entry_id: _entryId,
        type: 'audio',
        storage_path: '',
        public_url: dataUrl,
        filename: _file.name,
        mime_type: _file.type,
        size_bytes: _file.size,
        width: null,
        height: null,
        duration_seconds: null,
        sort_order: 0,
        created_at: new Date().toISOString(),
      }

      setAudioUrl(dataUrl)
      setUploading(false)
      return dataUrl
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
      return null
    }
  }

  return { uploadAudio, audioUrl, uploading, error }
}

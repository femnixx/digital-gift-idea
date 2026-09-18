'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Mic, Square, Play, Pause, Upload, RotateCcw, Music, Trash2 } from 'lucide-react'
import { db } from '@/lib/storage/localStorageDB'

export function VoiceNoteRecorder({ entryId, onSave }: { entryId: string; onSave?: () => void }) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'preview'>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const cleanup = useCallback(() => {
    if (audioUrl && mode !== 'preview') {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setUploadedFile(null)
    setMode('idle')
    setIsPlaying(false)
    setDuration(0)
    setError(null)
  }, [audioUrl, mode])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setMode('preview')
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setMode('recording')
      setError(null)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mode === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'audio/x-m4a']
    const validExts = ['.mp3', '.mp4', '.wav', '.webm', '.m4a']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Please upload an audio file (.mp3, .mp4, .wav, .webm)')
      return
    }

    setUploadedFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setMode('preview')
    setError(null)

    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSave = async () => {
    if (!audioUrl) return

    let finalUrl = audioUrl
    let mediaId = ''

    if (uploadedFile) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(uploadedFile)
      })
      finalUrl = dataUrl
      mediaId = 'media-' + Date.now()
      db.media.insert({
        id: mediaId,
        entry_id: entryId,
        type: 'audio',
        storage_path: '',
        public_url: dataUrl,
        filename: uploadedFile.name,
        mime_type: uploadedFile.type,
        size_bytes: uploadedFile.size,
        sort_order: 0,
        created_at: new Date().toISOString()
      })
    }

    const voiceNote = {
      id: 'vn-' + Date.now(),
      entry_id: entryId,
      media_id: mediaId || null,
      title: title || 'Voice Note',
      transcript: null,
      waveform_data: null,
      duration_seconds: duration,
      cassette_side: 'A' as const,
      created_at: new Date().toISOString()
    }

    const entry = db.entries.getBySlug(entryId)
    if (entry) {
      db.entries.update(entry.id, {
        voice_notes: [...(entry.voice_notes || []), voiceNote]
      })
    }

    cleanup()
    onSave?.()
  }

  useEffect(() => {
    if (mode === 'preview' && audioUrl) {
      const audio = new Audio(audioUrl)
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('ended', () => setIsPlaying(false))
      audioRef.current = audio
      return () => {
        audio.pause()
        audioRef.current = null
      }
    }
  }, [mode, audioUrl])

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {mode === 'idle' && (
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My voice note..."
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startRecording}
              className="btn-primary flex items-center justify-center gap-2 py-4"
            >
              <Mic className="w-5 h-5" />
              Record
            </button>
            <label className="btn-secondary flex items-center justify-center gap-2 py-4 cursor-pointer">
              <Upload className="w-5 h-5" />
              Upload
              <input
                type="file"
                accept=".mp3,.mp4,.wav,.webm,.m4a,audio/*,video/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {mode === 'recording' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-500 mx-auto flex items-center justify-center animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-sky-600 font-handwriting text-xl">Recording...</p>
          <button onClick={stopRecording} className="btn-secondary flex items-center gap-2 mx-auto">
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
        </div>
      )}

      {mode === 'preview' && audioUrl && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </button>
              <div className="flex-1">
                <p className="font-medium text-sky-900">{title || 'Voice Note'}</p>
                <p className="text-sm text-sky-500">
                  {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : 'Loading...'}
                </p>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4" />
              Save Voice Note
            </button>
            <button
              onClick={cleanup}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

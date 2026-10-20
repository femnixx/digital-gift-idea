'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface VoiceRecorderProps {
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  helper?: string
  error?: string
  maxDurationSeconds?: number
}

export function VoiceRecorder({
  value,
  onChange,
  label,
  helper,
  error,
  maxDurationSeconds = 120,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [denied, setDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number>(0)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    stopTimer()
    return () => stopTimer()
  }, [stopTimer])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      mediaRecorderRef.current = rec
      chunksRef.current = []
      setDenied(false)
      setRecording(true)
      setTime(0)
      startTimeRef.current = Date.now()

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        onChange(url)
        setRecording(false)
        cancelAnimationFrame(animationRef.current)
      }

      rec.start(200)

      const maxDur = maxDurationSeconds ?? 120

      const tick = () => {
        if (!recording) return
        const elapsed = Math.min(
          Math.floor((Date.now() - startTimeRef.current) / 1000),
          maxDur
        )
        setTime(elapsed)
        animationRef.current = requestAnimationFrame(tick)
      }
      animationRef.current = requestAnimationFrame(tick)

      if (maxDur) {
        timerRef.current = setTimeout(() => {
          if (rec && rec.state !== 'inactive') rec.stop()
        }, maxDur * 1000)
      }
    } catch {
      setDenied(true)
      setRecording(false)
    }
  }, [recording, maxDurationSeconds, onChange])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopTimer()
    cancelAnimationFrame(animationRef.current)
    setRecording(false)
  }, [stopTimer])

  const playRecording = useCallback(() => {
    if (!value) return
    setPlaying(true)
    const audio = new Audio(value)
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.play().catch(() => {})
  }, [value])

  const reRecord = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (value) URL.revokeObjectURL(value)
    onChange(null)
    setPlaying(false)
  }, [value, onChange])

  return (
    <div className="space-y-3">
      {label && (
        <label className="font-ui text-sm font-medium text-text">{label}</label>
      )}
      {denied && (
        <div className="flex items-center gap-2 p-3 rounded-[4px] bg-danger/10 border border-danger text-danger text-xs font-mono">
          <span aria-hidden="true">!</span>
          Microphone access denied. Upload an audio file instead.
        </div>
      )}
      {recording ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={stopRecording}
            className="btn-danger px-6 py-3 text-sm"
          >
            Stop recording
          </button>
          <span className="font-mono text-sm font-medium text-text">
            {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
          </span>
        </div>
      ) : value ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={playRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-[4px] border border-line bg-surface shadow-btn ${
              playing ? 'bg-accent text-white border-accent' : ''
            }`}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            onClick={reRecord}
            className="text-xs text-text-muted hover:text-danger underline underline-offset-2"
          >
            Re-record
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="btn px-6 py-3 text-sm"
        >
          Record voice note
        </button>
      )}
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
    </div>
  )
}

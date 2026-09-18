'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, RotateCcw, Heart, Sparkles, Music } from 'lucide-react'

interface VoiceNote {
  id: string
  title: string | null
  audioUrl: string
  duration: number
  waveformData?: number[]
  cassetteSide: 'A' | 'B'
  transcript?: string | null
}

interface CassettePlayerProps {
  notes: VoiceNote[]
  autoPlay?: boolean
  className?: string
}

export function CassettePlayer({ notes, autoPlay = false, className = '' }: CassettePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const currentNote = notes[currentIndex]

  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentNote.audioUrl
      audioRef.current.volume = muted ? 0 : volume
      if (autoPlay) {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [currentNote, autoPlay])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Auto-play next
      if (currentIndex < notes.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [currentNote, currentIndex, notes.length])

  // Waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaElementAudioSourceNode | null = null
    let dataArray: Uint8Array | null = null

    const setupAudioContext = async () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        dataArray = new Uint8Array(analyser.frequencyBinCount)
      } catch (e) {
        console.warn('AudioContext not available:', e)
      }
    }

    setupAudioContext()

    const draw = () => {
      if (!analyser || !dataArray || !ctx) return
      
      animationRef.current = requestAnimationFrame(draw)
      
      analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
      
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      
      const barWidth = (canvas.width / dpr) / dataArray.length * 2
      let x = 0
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height / dpr) * 0.8
        const hue = 340 + (i / dataArray.length) * 30 // Rose to lavender
        
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
        ctx.fillRect(
          x,
          (canvas.height / dpr) / 2 - barHeight / 2,
          barWidth,
          barHeight
        )
        
        // Mirror below center
        ctx.fillRect(
          x,
          (canvas.height / dpr) / 2,
          barWidth,
          barHeight / 2
        )
        
        x += barWidth + 1
      }
    }

    if (isPlaying) {
      draw()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [isPlaying, currentNote])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
    setCurrentTime(percent * duration)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setMuted(newVolume === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleMute = () => {
    setMuted(!muted)
    if (audioRef.current) {
      audioRef.current.volume = muted ? volume : 0
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const goToNote = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(false)
    setCurrentTime(0)
  }

  return (
    <motion.div
      className={`cassette p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <audio ref={audioRef} preload="metadata" />

      {/* Cassette Tape Visual */}
      <motion.div
        className="relative mx-auto mb-6"
        style={{ width: '280px', height: '160px' }}
      >
        {/* Cassette body */}
        <div className="absolute inset-0 bg-gray-800 rounded-lg shadow-cassette border border-gray-700 relative overflow-hidden">
          {/* Top label area */}
          <div className="absolute top-4 left-4 right-4 h-20 bg-gray-700 rounded border border-gray-600 flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <span className="font-mono text-xs text-gray-300">LOVE NOTES</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded border-2 font-mono text-xs flex items-center justify-center ${
                currentNote.cassetteSide === 'A' 
                  ? 'border-sky-400 text-sky-400 bg-sky-400/10' 
                  : 'border-lavender-400 text-lavender-400 bg-lavender-400/10'
              }`}>
                {currentNote.cassetteSide}
              </span>
            </div>
          </div>

          {/* Tape wheels */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-16">
            {['left', 'right'].map((side) => (
              <motion.div
                key={side}
                className="relative w-16 h-16"
                animate={{
                  rotate: isPlaying ? 360 : 0,
                }}
                transition={{
                  duration: side === 'left' ? 2 : 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="absolute inset-0 bg-gray-600 rounded-full border-2 border-gray-500 flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  </div>
                </div>
                {/* Tape spool holes */}
                <div className="absolute inset-1 bg-gray-600 rounded-full" />
                {[0, 90, 180, 270].map((angle) => (
                  <div
                    key={angle}
                    className="absolute w-1 h-1 bg-gray-500 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-20px)`,
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </div>

          {/* Tape connecting wheels */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-2 bg-gray-600 rounded" />

          {/* Current time display on tape */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded text-white text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Floating hearts when playing */}
        <AnimatePresence>
          {isPlaying && [...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-sky-400/60 text-xl pointer-events-none"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '20%',
              }}
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -80, opacity: [0, 1, 0], scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1,
                ease: 'easeOut',
              }}
            >
              ♡
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Track Info */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sky-500 text-sm uppercase tracking-wider mb-1">
          Now Playing • Side {currentNote.cassetteSide}
        </p>
        <h3 className="font-serif text-xl md:text-2xl font-semibold text-sky-900 mb-1">
          {currentNote.title || 'Untitled Voice Note'}
        </h3>
        {currentNote.transcript && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sky-500 text-sm hover:text-sky-600 flex items-center justify-center gap-1 mt-2"
          >
            <Music className="w-4 h-4" aria-hidden="true" />
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        )}

        <AnimatePresence>
          {showTranscript && currentNote.transcript && (
            <motion.div
              className="mt-4 p-4 bg-cream-50 rounded-xl border border-sky-100 text-left max-w-md mx-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="font-handwriting text-sky-700 text-sm leading-relaxed whitespace-pre-wrap">
                {currentNote.transcript}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-2 bg-sky-100 rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
            <motion.div
              className="w-3 h-3 bg-white rounded-full shadow-lg border-2 border-sky-400"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(50%)' }}
              animate={{ scale: isPlaying ? 1.2 : 1 }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-sky-400 mt-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => goToNote(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous note"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <motion.button
          onClick={togglePlay}
          className="p-4 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </motion.button>

        <button
          onClick={() => goToNote(Math.min(notes.length - 1, currentIndex + 1))}
          disabled={currentIndex === notes.length - 1}
          className="p-3 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next note"
        >
          <RotateCcw className="w-5 h-5 rotate-180" />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleMute}
          className="p-2 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-32 h-2 bg-sky-100 rounded-full appearance-none cursor-pointer accent-sky-500"
          aria-label="Volume"
        />
      </div>

      {/* Playlist */}
      {notes.length > 1 && (
        <motion.div
          className="mt-6 pt-6 border-t border-sky-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sky-500 text-sm uppercase tracking-wider mb-3">Side {currentNote.cassetteSide} Tracks</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes
              .filter(n => n.cassetteSide === currentNote.cassetteSide)
              .map((note, index) => (
                <motion.button
                  key={note.id}
                  onClick={() => goToNote(notes.indexOf(note))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    notes.indexOf(note) === currentIndex
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'bg-white text-sky-700 hover:bg-sky-50 border border-sky-100'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notes.indexOf(note) === currentIndex
                      ? 'bg-white/20 text-white'
                      : 'bg-sky-100 text-sky-500'
                  }`}>
                    {notes.indexOf(note) === currentIndex && isPlaying ? (
                      <motion.span
                        className="flex items-center gap-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <span className="w-1.5 h-1.5 bg-current rounded-full" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full" style={{ animationDelay: '100ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full" style={{ animationDelay: '200ms' }} />
                      </motion.span>
                    ) : (
                      <Music className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{note.title || 'Untitled'}</p>
                    <p className="text-sm opacity-70 font-mono">
                      {formatTime(note.duration)}
                    </p>
                  </div>
                  {notes.indexOf(note) === currentIndex && (
                    <Heart className="w-5 h-5 text-sky-400 animate-heartbeat" aria-hidden="true" />
                  )}
                </motion.button>
              ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Mini cassette player for inline use
export function MiniCassettePlayer({ audioUrl, title, duration: durationProp }: { audioUrl: string; title?: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationProp || 0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="cassette p-4 flex items-center gap-4">
      <audio ref={audioRef} preload="metadata" />

      {/* Mini tape wheels */}
      <motion.div
        className="flex gap-2"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        {[1, 2].map((i) => (
          <div key={i} className="w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-600 relative flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-600 rounded-full" />
          </div>
        ))}
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sky-900 truncate">{title || 'Voice Note'}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-sky-100 rounded-full relative" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            if (audioRef.current) {
              audioRef.current.currentTime = percent * duration
            }
          }}>
            <motion.div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-xs text-sky-500 font-mono w-14 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <motion.button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </motion.button>
    </div>
  )
}
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Live audio level meter for a microphone stream.
 *
 * Taps the stream through an AnalyserNode and reports a fixed number of
 * frequency bars, normalised to 0..1, while recording. The finished array is
 * what gets persisted in voice_notes.waveform_data, so a saved note can be drawn
 * without replaying it.
 */

/** Bars shown while recording and stored for playback. */
export const BAR_COUNT = 48

export interface AudioMeter {
  /** Current bar heights, 0..1. */
  levels: number[]
  /** Called once recording finishes, with the finished array. */
  finish: () => number[]
  /** Releases the audio context and stops sampling. */
  stop: () => void
}

function silence(): number[] {
  return Array.from({ length: BAR_COUNT }, () => 0)
}

function normalise(values: number[]): number[] {
  // Scale so the loudest bar fills the row, then keep a visible floor for quiet
  // speech. Without this a quiet microphone renders as a flat line.
  const peak = Math.max(...values, 0.0001)
  const scaled = values.map((v) => Math.min(1, v / peak))
  return scaled.map((v) => Math.max(v, 0.04))
}

export function useAudioMeter(stream: MediaStream | null, active: boolean) {
  const [levels, setLevels] = useState<number[]>(silence)
  const finished = useRef<number[]>(silence())
  const frame = useRef(0)

  useEffect(() => {
    if (!stream || !active) {
      setLevels(silence())
      return
    }

    let context: AudioContext
    let analyser: AnalyserNode
    let source: MediaStreamAudioSourceNode

    try {
      context = new AudioContext()
      analyser = context.createAnalyser()
      // A modest FFT size is plenty for a visual and keeps the loop cheap.
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      source = context.createMediaStreamSource(stream)
      source.connect(analyser)
    } catch {
      // No Web Audio support: the recording itself still works without bars.
      return
    }

    const buffer = new Uint8Array(analyser.frequencyBinCount)
    const accumulator = silence()

    const sample = () => {
      frame.current = requestAnimationFrame(sample)
      analyser.getByteFrequencyData(buffer)

      // Bucket the frequency bins into BAR_COUNT bands so the meters cover the
      // whole spectrum rather than only the lowest, where most energy sits.
      const band = Math.floor(buffer.length / BAR_COUNT) || 1
      for (let i = 0; i < BAR_COUNT; i += 1) {
        let sum = 0
        for (let j = 0; j < band; j += 1) {
          sum += buffer[i * band + j] ?? 0
        }
        accumulator[i] = sum / band / 255
      }

      // Rolling decay keeps the trailing bars falling instead of snapping off.
      for (let i = 0; i < BAR_COUNT; i += 1) {
        accumulator[i] = Math.max(accumulator[i], (finished.current[i] ?? 0) * 0.92)
      }

      setLevels([...accumulator])
    }

    sample()

    return () => {
      cancelAnimationFrame(frame.current)
      source.disconnect()
      analyser.disconnect()
      void context.close()
    }
  }, [stream, active])

  const finish = useCallback(() => {
    finished.current = [...levels]
    return normalise(finished.current)
  }, [levels])

  return { levels, finish }
}

/**
 * Draws a saved waveform.
 *
 * Levels are read once on mount, not per frame, so a page showing many saved
 * notes does not re-render them on every animation frame.
 */
export function WaveformBars({
  levels,
  className = '',
  height = 48,
  barClassName = 'bg-brand',
}: {
  /** Required: bar heights, 0..1. */
  levels: number[] | null | undefined
  /** Optional. */
  className?: string
  /** Optional: pixel height. */
  height?: number
  /** Optional: colour classes for the bars. */
  barClassName?: string
}) {
  const bars = levels && levels.length > 0 ? levels : silence()

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height }}
      role="img"
      aria-label={levels && levels.length > 0 ? 'Audio waveform' : 'No waveform recorded'}
    >
      {bars.map((level, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${barClassName} transition-[height] duration-200`}
          style={{ height: `${Math.max(6, level * 100)}%` }}
        />
      ))}
    </div>
  )
}

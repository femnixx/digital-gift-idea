'use client'

/**
 * Digital Bouquet Builder
 *
 * A single, self-contained component: pick flowers, arrange them, wrap the
 * bouquet and read the note. Copy this file into any React + Tailwind project
 * and it works as-is — it imports nothing but React.
 *
 * Layout: side-by-side on desktop, stacked on mobile.
 */

import { useCallback, useMemo, useState } from 'react'

/* ------------------------------------------------------------------ *
 * Data
 * ------------------------------------------------------------------ */

interface FlowerSpec {
  id: string
  name: string
  meaning: string
  petal: string
  center: string
}

const FLOWERS: FlowerSpec[] = [
  { id: 'rose', name: 'Roses', meaning: 'Love', petal: '#e11d48', center: '#fb7185' },
  { id: 'tulip', name: 'Tulips', meaning: 'Perfect Love', petal: '#f472b6', center: '#fbcfe8' },
  { id: 'sunflower', name: 'Sunflowers', meaning: 'Adoration', petal: '#f59e0b', center: '#78350f' },
  { id: 'daisy', name: 'Daisies', meaning: 'Innocence', petal: '#ffffff', center: '#f59e0b' },
  { id: 'lily', name: 'Lilies', meaning: 'Devotion', petal: '#fda4af', center: '#fecdd3' },
  { id: 'lavender', name: 'Lavender', meaning: 'Tranquility', petal: '#a78bfa', center: '#ede9fe' },
]

interface WrapSpec {
  id: string
  name: string
  /** Paper colour used for the cone drawn behind the stems. */
  paper: string
  /** Trim colour for the ribbon band. */
  ribbon: string
}

const WRAPS: WrapSpec[] = [
  { id: 'kraft', name: 'Kraft Paper', paper: '#c8a27a', ribbon: '#8b5e34' },
  { id: 'ribbon', name: 'Pink Ribbon', paper: '#f9c8d9', ribbon: '#e11d48' },
  { id: 'mesh', name: 'Mesh', paper: '#dbeafe', ribbon: '#93c5fd' },
]

/** Guards against an unreadable pile-up. */
const MAX_FLOWERS = 24

/* ------------------------------------------------------------------ *
 * Bloom — a small SVG flower head, tinted per species
 * ------------------------------------------------------------------ */

function Bloom({ flower, size }: { flower: FlowerSpec; size: number }) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className="drop-shadow-sm"
    >
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="27"
          rx="13"
          ry="20"
          fill={flower.petal}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="1"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="12" fill={flower.center} />
      <circle cx="50" cy="50" r="5" fill="rgba(0,0,0,0.12)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Placement
 *
 * Flowers are placed as a fan: spread evenly across the canvas, arcing upward
 * in the middle so the cluster reads as a dome, and rotated so they lean the
 * way a real hand-tied bouquet does. Purely a function of index and count, so
 * adding the same flowers twice gives the same arrangement.
 * ------------------------------------------------------------------ */

interface Placement {
  left: string
  bottom: number
  rotate: number
  scale: number
  z: number
}

function placementFor(index: number, total: number): Placement {
  // 0 across the left, 1 across the right.
  const t = total <= 1 ? 0.5 : index / (total - 1)

  // Arc: tallest in the middle, tapering to the edges.
  const lift = Math.sin(t * Math.PI)

  return {
    left: `${12 + t * 76}%`,
    bottom: 104 + lift * 128,
    rotate: (t - 0.5) * 34,
    scale: 0.82 + lift * 0.34,
    // Later flowers sit in front, matching how a bouquet is built outward.
    z: index,
  }
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export default function DigitalBouquetBuilder() {
  const [flowers, setFlowers] = useState<FlowerSpec[]>([])
  const [wrap, setWrap] = useState<WrapSpec>(WRAPS[0])
  const [message, setMessage] = useState('')
  const [wrapped, setWrapped] = useState(false)

  const placed = useMemo(
    () => flowers.map((flower, i) => ({ flower, ...placementFor(i, flowers.length) })),
    [flowers]
  )

  const addFlower = useCallback((flower: FlowerSpec) => {
    setFlowers((prev) => (prev.length >= MAX_FLOWERS ? prev : [...prev, flower]))
  }, [])

  const removeFlower = useCallback((index: number) => {
    setFlowers((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const reset = useCallback(() => {
    setFlowers([])
    setMessage('')
    setWrapped(false)
  }, [])

  /* ---------------- final presentation ---------------- */

  if (wrapped) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-fuchsia-50 px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="relative h-[26rem] rounded-[2rem] border border-rose-100 bg-white/60 shadow-[0_20px_60px_-24px_rgba(190,24,93,0.35)] backdrop-blur">
            {/* wrap cone */}
            <div
              className="absolute bottom-0 left-1/2 h-52 w-[22rem] -translate-x-1/2 rounded-b-[2rem] transition-all duration-700"
              style={{
                background: `linear-gradient(180deg, ${wrap.paper} 0%, ${wrap.paper}cc 100%)`,
                clipPath: 'polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)',
              }}
            />
            <div
              className="absolute bottom-[8.5rem] left-1/2 h-3 w-64 -translate-x-1/2 rounded-full"
              style={{ background: wrap.ribbon }}
            />

            {placed.map(({ flower, left, bottom, rotate, scale, z }, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWrapped(false)}
                className="absolute -translate-x-1/2 transition-transform duration-500 hover:scale-110"
                style={{ left, bottom, transform: `translateX(-50%) rotate(${rotate}deg) scale(${scale})`, zIndex: z }}
                aria-label={`Remove ${flower.name}`}
              >
                <Bloom flower={flower} size={92} />
              </button>
            ))}
          </div>

          {message.trim() && (
            <div className="mt-8 rounded-[1.5rem] border border-rose-100 bg-white p-8 text-center shadow-[0_16px_40px_-24px_rgba(190,24,93,0.4)]">
              <p className="font-serif text-2xl leading-relaxed text-rose-950 whitespace-pre-line">
                {message}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setWrapped(false)}
              className="rounded-full bg-rose-600 px-7 py-3 text-sm font-medium text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Keep arranging
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-rose-200 bg-white px-7 py-3 text-sm font-medium text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------- builder ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-fuchsia-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="font-serif text-4xl text-rose-950 sm:text-5xl">Digital Bouquet Builder</h1>
          <p className="mt-2 text-rose-700/80">Choose your flowers, then wrap them into something worth keeping.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          {/* ---------- picker ---------- */}
          <div className="space-y-6">
            <section aria-labelledby="flowers-heading" className="rounded-[1.5rem] border border-rose-100 bg-white/80 p-5 shadow-[0_12px_36px_-24px_rgba(190,24,93,0.45)] backdrop-blur">
              <h2 id="flowers-heading" className="mb-4 font-serif text-xl text-rose-950">
                Pick a flower
              </h2>
              <ul className="space-y-2">
                {FLOWERS.map((flower) => (
                  <li key={flower.id}>
                    <button
                      type="button"
                      onClick={() => addFlower(flower)}
                      disabled={flowers.length >= MAX_FLOWERS}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <span className="shrink-0">
                        <Bloom flower={flower} size={44} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-rose-950">{flower.name}</span>
                        <span className="block text-sm text-rose-700/70">{flower.meaning}</span>
                      </span>
                      {flowers.length < MAX_FLOWERS && (
                        <span className="ml-auto text-lg text-rose-300 transition group-hover:text-rose-500" aria-hidden>
                          +
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-rose-600/70">
                {flowers.length} of {MAX_FLOWERS} placed
              </p>
            </section>

            <section aria-labelledby="wrap-heading" className="rounded-[1.5rem] border border-rose-100 bg-white/80 p-5 shadow-[0_12px_36px_-24px_rgba(190,24,93,0.45)] backdrop-blur">
              <h2 id="wrap-heading" className="mb-4 font-serif text-xl text-rose-950">
                Wrapping paper
              </h2>
              <div className="flex flex-wrap gap-2">
                {WRAPS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setWrap(option)}
                    aria-pressed={wrap.id === option.id}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      wrap.id === option.id
                        ? 'border-rose-500 bg-rose-50 text-rose-800'
                        : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/10" style={{ background: option.paper }} />
                    {option.name}
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="note-heading" className="rounded-[1.5rem] border border-rose-100 bg-white/80 p-5 shadow-[0_12px_36px_-24px_rgba(190,24,93,0.45)] backdrop-blur">
              <label htmlFor="note" className="mb-3 block font-serif text-xl text-rose-950">
                Your note
              </label>
              <textarea
                id="note"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Say something only they would understand…"
                className="w-full resize-none rounded-2xl border border-rose-200 bg-white p-3 text-sm text-rose-950 placeholder:text-rose-400/70 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <p className="mt-2 text-xs text-rose-600/70">It appears beside the bouquet once you wrap it.</p>
            </section>
          </div>

          {/* ---------- canvas ---------- */}
          <div className="flex flex-col gap-4">
            <div className="relative h-[28rem] flex-1 overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-b from-white/70 to-rose-100/50 shadow-[inset_0_2px_24px_rgba(190,24,93,0.06)]">
              {flowers.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="text-5xl" aria-hidden>💐</span>
                  <p className="mt-4 font-serif text-xl text-rose-900">Your bouquet is empty</p>
                  <p className="mt-1 text-sm text-rose-700/70">Tap a flower on the left to start arranging.</p>
                </div>
              ) : (
                <>
                  {/* wrap cone, behind the flowers */}
                  <div
                    className="absolute bottom-0 left-1/2 h-56 w-[26rem] max-w-[92%] -translate-x-1/2 rounded-b-[2rem] transition-all duration-700"
                    style={{
                      background: `linear-gradient(180deg, ${wrap.paper} 0%, ${wrap.paper}cc 100%)`,
                      clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
                    }}
                  />
                  <div
                    className="absolute bottom-[9.5rem] left-1/2 h-3.5 w-72 max-w-[70%] -translate-x-1/2 rounded-full shadow-sm"
                    style={{ background: wrap.ribbon }}
                  />

                  {placed.map(({ flower, left, bottom, rotate, scale, z }, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => removeFlower(i)}
                      className="absolute -translate-x-1/2 transition-transform duration-300 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      style={{
                        left,
                        bottom,
                        transform: `translateX(-50%) rotate(${rotate}deg) scale(${scale})`,
                        zIndex: z,
                      }}
                      aria-label={`Remove ${flower.name}`}
                      title="Click to remove"
                    >
                      <Bloom flower={flower} size={96} />
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-rose-100 bg-white/80 p-4 shadow-[0_12px_36px_-24px_rgba(190,24,93,0.45)] backdrop-blur">
              <p className="text-sm text-rose-700/80">
                {flowers.length === 0
                  ? 'Nothing to wrap yet'
                  : `${flowers.length} flower${flowers.length === 1 ? '' : 's'} arranged`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={flowers.length === 0 && !message}
                  className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Reset bouquet
                </button>
                <button
                  type="button"
                  onClick={() => setWrapped(true)}
                  disabled={flowers.length === 0}
                  className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Wrap bouquet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Heart, X, MessageSquare, Sparkles, Shuffle, Circle, Flower2, SlidersHorizontal } from 'lucide-react'
import { FLOWER_CONFIG, type FlowerType, type BouquetFlower, type ArrangementType } from '@/types'
import { ProceduralFlower } from '@/components/features/ProceduralFlower'

function mulberry32(a: number) {
  return function() {
    a |= 0
    a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function createRng(seed: number) {
  return mulberry32(seed)
}

/**
 * Arrangement maths, in one coordinate space.
 *
 * Positions are percentages of the canvas: the render applies them directly as
 * `left: ${x}%` and `bottom: ${100 - y}%`. Every function below therefore works
 * in 0..100 and takes no width or height, which is what keeps this honest — the
 * previous versions were handed `containerSize` in pixels and mixed the two, so
 * Random produced values up to 388% (rendered off-canvas) and the Bouquet
 * spiral collapsed onto a single point because its clamps were fed pixels.
 */
function arrangeInVase(flowers: BouquetFlower[], vaseWidthPercent: number, vaseCenterX: number, vaseTopY: number, rng: () => number): BouquetFlower[] {
  const count = flowers.length
  const radiusX = vaseWidthPercent * 0.8
  const radiusY = 18

  return flowers.map((f, i) => {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 + (rng() - 0.5) * 0.6
    const r = 0.5 + rng() * 0.5
    const x = vaseCenterX + Math.cos(angle) * radiusX * r
    const y = vaseTopY - Math.abs(Math.sin(angle)) * radiusY * r - rng() * 12
    return {
      ...f,
      position_x: clampPercent(x),
      position_y: clampPercent(y),
    }
  })
}

/** Keeps a percentage inside the canvas, with a little deliberate bleed. */
function clampPercent(value: number, min = 2, max = 98): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * A hand-tied dome, using the golden angle so the heads pack without leaving
 * gaps the way evenly-spaced rings do. The middle sits highest, which is what
 * makes a bouquet read as round rather than as a flat grid.
 */
function arrangeCircular(flowers: BouquetFlower[], rng: () => number): BouquetFlower[] {
  const cx = 50
  const cy = 40
  const baseRadius = 30
  const goldenAngle = 137.508 * (Math.PI / 180)

  return flowers.map((f, i) => {
    const angle = i * goldenAngle + (rng() - 0.5) * 0.4
    const radius = baseRadius * (0.6 + rng() * 0.4)
    return {
      ...f,
      position_x: clampPercent(cx + Math.cos(angle) * radius),
      position_y: clampPercent(cy + Math.sin(angle) * radius * 0.9),
    }
  })
}

/** Scattered, but kept inside the frame. */
function arrangeRandom(flowers: BouquetFlower[], rng: () => number): BouquetFlower[] {
  const margin = 12
  return flowers.map((f) => ({
    ...f,
    position_x: margin + rng() * (100 - margin * 2),
    position_y: margin + rng() * (100 - margin * 2),
  }))
}

/** The classic heart curve, scaled to percent so it fills the canvas. */
function arrangeHeart(flowers: BouquetFlower[], rng: () => number): BouquetFlower[] {
  const cx = 50
  const cy = 58
  const spread = 2.4

  return flowers.map((f, i) => {
    const t = (i / Math.max(flowers.length, 1)) * Math.PI * 2
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    return {
      ...f,
      position_x: clampPercent(cx + hx * spread + (rng() - 0.5) * 4),
      position_y: clampPercent(cy + hy * spread + (rng() - 0.5) * 4),
    }
  })
}

function applyArrangement(
  flowers: BouquetFlower[],
  type: ArrangementType,
  rng: () => number
): BouquetFlower[] {
  const vaseCenterX = 50
  const vaseTopY = 72
  const vaseWidth = 55

  switch (type) {
    case 'vase':
      return arrangeInVase(flowers, vaseWidth, vaseCenterX, vaseTopY, rng)
    case 'circular':
      return arrangeCircular(flowers, rng)
    case 'heart':
      return arrangeHeart(flowers, rng)
    case 'random':
    default:
      return arrangeRandom(flowers, rng)
  }
}

function autoArrange(flowers: BouquetFlower[], iterations: number = 40): BouquetFlower[] {
  let result = [...flowers]
  const minDist = 18

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].position_x - result[i].position_x
        const dy = result[j].position_y - result[i].position_y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist
          const nx = dx / dist
          const ny = dy / dist
          const move = overlap * 0.5

          result[i] = {
            ...result[i],
            position_x: Math.max(5, Math.min(95, result[i].position_x - nx * move)),
            position_y: Math.max(5, Math.min(95, result[i].position_y - ny * move)),
          }
          result[j] = {
            ...result[j],
            position_x: Math.max(5, Math.min(95, result[j].position_x + nx * move)),
            position_y: Math.max(5, Math.min(95, result[j].position_y + ny * move)),
          }
        }
      }
    }
  }

  return result
}

function generateBouquet(count: number, seed: number, entryId: string): BouquetFlower[] {
  const rng = createRng(seed)
  const types: FlowerType[] = Object.keys(FLOWER_CONFIG) as FlowerType[]
  const newFlowers: BouquetFlower[] = []

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(rng() * types.length)]
    const colorOptions = FLOWER_CONFIG[type].defaultColors
    const color = colorOptions[Math.floor(rng() * colorOptions.length)]
    const flowerSeed = Math.floor(rng() * 1000000)

    newFlowers.push({
      id: `flower-${seed}-${i}`,
      entry_id: entryId,
      flower_type: type,
      color,
      note: null,
      position_x: 50,
      position_y: 50,
      rotation: rng() * 30 - 15,
      scale: 0.8 + rng() * 0.4,
      sort_order: i,
      created_at: new Date().toISOString(),
      generation_seed: flowerSeed,
    })
  }

  return newFlowers
}

interface DigitalBouquetProps {
  flowers: BouquetFlower[]
  onFlowerClick?: (flower: BouquetFlower) => void
  isEditing?: boolean
  onAddFlower?: () => void
  onRemoveFlower?: (id: string) => void
  onUpdateFlower?: (id: string, updates: Partial<BouquetFlower>) => void
  onReplaceFlowers?: (flowers: BouquetFlower[]) => void
  entryId?: string
  flowerCount?: number
  arrangement?: ArrangementType
}

export function DigitalBouquet({
  flowers,
  onFlowerClick,
  isEditing = false,
  onAddFlower,
  onRemoveFlower,
  onUpdateFlower,
  onReplaceFlowers,
  entryId,
  flowerCount: initialFlowerCount,
  arrangement: initialArrangement,
}: DigitalBouquetProps) {
  const [selectedFlower, setSelectedFlower] = useState<BouquetFlower | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 400, height: 500 })
  const [flowerCount, setFlowerCount] = useState(initialFlowerCount ?? 10)
  const [arrangement, setArrangement] = useState<ArrangementType>(initialArrangement ?? 'circular')
  const [generationSeed, setGenerationSeed] = useState(Date.now())
  const [localFlowers, setLocalFlowers] = useState<BouquetFlower[]>(flowers)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setLocalFlowers(flowers)
  }, [flowers])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleFlowerClick = (flower: BouquetFlower, e: any) => {
    e.stopPropagation()
    if (isEditing) return
    setSelectedFlower(flower)
    onFlowerClick?.(flower)
  }

  const handleDrag = (flower: BouquetFlower, e: any) => {
    if (!isEditing) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    onUpdateFlower?.(flower.id, {
      position_x: Math.max(10, Math.min(90, x)),
      position_y: Math.max(10, Math.min(90, y)),
    })
  }

  const handleDragEnd = (flower: BouquetFlower) => {
    if (!isEditing) return
    onUpdateFlower?.(flower.id, {
      rotation: Math.random() * 10 - 5,
    })
  }

  const handleRegenerate = () => {
    const newSeed = Date.now()
    const newFlowers = generateBouquet(flowerCount, newSeed, entryId || '')
    const rng = createRng(newSeed)
    const arranged = applyArrangement(newFlowers, arrangement, rng)
    setLocalFlowers(arranged)
    setGenerationSeed(newSeed)
    onReplaceFlowers?.(arranged)
  }

  const handleAutoArrange = () => {
    const arranged = autoArrange(localFlowers)
    setLocalFlowers(arranged)
  }

  const handleArrangementChange = (type: ArrangementType) => {
    setArrangement(type)
    const rng = createRng(generationSeed)
    const arranged = applyArrangement(localFlowers, type, rng)
    setLocalFlowers(arranged)
  }

  const arrangements: { type: ArrangementType; label: string; icon: React.ReactNode }[] = [
    { type: 'random', label: 'Random', icon: <Shuffle className="w-4 h-4" /> },
    { type: 'circular', label: 'Bouquet', icon: <Circle className="w-4 h-4" /> },
    { type: 'vase', label: 'Vase', icon: <Flower2 className="w-4 h-4" /> },
    { type: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  ]

  const displayFlowers = localFlowers.length > 0 ? localFlowers : flowers

  const vaseWidth = useMemo(() => (isMobile ? 'w-28' : 'w-40'), [isMobile])
  const vaseHeight = useMemo(() => (isMobile ? 'h-20' : 'h-28'), [isMobile])

  return (
    <motion.div
      ref={containerRef}
      className="relative rounded-3xl bg-surface-2 overflow-hidden"
      style={{ minHeight: isMobile ? '420px' : '520px' }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.05 } }
      }}
    >
      {/* Controls */}
      {isEditing && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30">
          <div className="bg-surface/90 backdrop-blur rounded-2xl border border-line p-2 sm:p-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {arrangements.map(arr => (
                <button
                  key={arr.type}
                  onClick={() => handleArrangementChange(arr.type)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center ${
                    arrangement === arr.type
                      ? 'bg-brand text-white'
                      : 'bg-surface text-body hover:bg-surface-2'
                  }`}
                >
                  {arr.icon}
                  <span className="ml-1 hidden sm:inline">{arr.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-body-muted font-medium whitespace-nowrap">Count</label>
              <input
                type="range"
                min="3"
                max="20"
                value={flowerCount}
                onChange={(e) => setFlowerCount(Number(e.target.value))}
                className="w-16 sm:w-20 h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-stone-600"
              />
              <span className="text-xs text-body-muted w-4 text-center">{flowerCount}</span>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleAutoArrange}
                className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-body hover:bg-surface transition-colors flex items-center"
              >
                <SlidersHorizontal className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Auto-arrange</span>
              </button>
              <button
                onClick={handleRegenerate}
                className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-white hover:bg-stone-900 transition-colors flex items-center"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vase area */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none" style={{ height: isMobile ? '35%' : '40%' }}>
        <div className={`relative ${vaseWidth} ${vaseHeight}`}>
          {/* Vase SVG */}
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full text-stone-300/60">
            <path
              d="M50 140 L30 30 Q80 15 130 30 L110 140 Z"
              fill="currentColor"
              fillOpacity="0.25"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <ellipse cx="80" cy="30" rx="48" ry="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <ellipse cx="80" cy="140" rx="28" ry="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>

          {/* Flower area - above vase opening */}
          <div className="absolute left-1/2 -translate-x-1/2 w-full" style={{ height: '120%', bottom: '100%' }}>
            <AnimatePresence mode="popLayout">
              {displayFlowers.map((flower, index) => {
                const seed = flower.generation_seed || parseInt(flower.id.slice(-6), 36)
                const stemRng = createRng(seed)
                const stemHeight = 80 + Math.floor(stemRng() * 50)

                return (
                  <motion.div
                    key={flower.id}
                    className="absolute flex flex-col items-center select-none"
                    style={{
                      left: `${flower.position_x}%`,
                      bottom: `${100 - flower.position_y}%`,
                      transform: `translateX(-50%) rotate(${flower.rotation}deg) scale(${flower.scale})`,
                      zIndex: index + 10,
                    }}
                    initial={{ y: 40, opacity: 0, rotate: -20, scale: 0 }}
                    animate={{ y: 0, opacity: 1, rotate: flower.rotation, scale: flower.scale }}
                    exit={{ y: -30, opacity: 0, scale: 0, rotate: 20 }}
                    transition={{
                      delay: 0.08 * index,
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 120,
                      damping: 15,
                    }}
                    onClick={(e) => handleFlowerClick(flower, e)}
                    draggable={isEditing}
                    onDrag={(e) => handleDrag(flower, e)}
                    onDragEnd={() => handleDragEnd(flower)}
                    whileHover={isEditing ? {} : { scale: (flower.scale || 1) * 1.08 }}
                    whileTap={isEditing ? {} : { scale: (flower.scale || 1) * 0.95 }}
                  >
                    <motion.div
                      className="w-1 rounded-t origin-bottom"
                      style={{
                        height: `${stemHeight}px`,
                        background: 'linear-gradient(to top, #57534e, #a8a29e)',
                      }}
                      animate={{ rotate: [0, 2, -2, 0] }}
                      transition={{
                        duration: 3 + (seed % 3),
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="flex items-center justify-center"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
                      animate={{ scale: [1, 1.04, 1], rotate: [0, 2, -2, 0] }}
                      transition={{
                        duration: 4 + (seed % 3),
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ProceduralFlower
                        type={flower.flower_type}
                        color={flower.color}
                        seed={seed}
                        size={isMobile ? 55 : 72}
                        simplified={isMobile}
                      />
                    </motion.div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {displayFlowers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-body-muted font-handwriting text-lg">Your bouquet is empty 🌱</p>
        </div>
      )}

      {/* Note popup */}
      {selectedFlower && selectedFlower.note && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur rounded-xl shadow-lg border border-line px-4 py-3 max-w-xs z-40"
          style={{ bottom: isMobile ? '38%' : '42%' }}
        >
          <p className="font-handwriting text-body text-sm">{selectedFlower.note}</p>
          <button
            onClick={() => setSelectedFlower(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface text-body-muted flex items-center justify-center hover:bg-stone-300"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

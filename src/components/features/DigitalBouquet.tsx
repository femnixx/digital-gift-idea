'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Heart, X, MessageSquare, Sparkles, Shuffle, Circle, Flower2, SlidersHorizontal } from 'lucide-react'
import { FLOWER_CONFIG, type FlowerType, type BouquetFlower, type ArrangementType } from '@/types'
import { ProceduralFlower } from '@/components/features/ProceduralFlower'

// --- Seeded Random (Mulberry32) ---
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

// --- Arrangement Algorithms ---
function arrangeRandom(flowers: BouquetFlower[], width: number, height: number, rng: () => number): BouquetFlower[] {
  const margin = 12
  return flowers.map(f => ({
    ...f,
    position_x: margin + rng() * (width - margin * 2),
    position_y: margin + rng() * (height - margin * 2),
  }))
}

function arrangeCircular(flowers: BouquetFlower[], width: number, height: number, rng: () => number): BouquetFlower[] {
  const cx = width / 2
  const cy = height * 0.38
  const baseRadius = Math.min(width, height) * 0.28
  const goldenAngle = 137.508 * (Math.PI / 180)

  return flowers.map((f, i) => {
    const angle = i * goldenAngle + (rng() - 0.5) * 0.4
    const radius = baseRadius * (0.65 + rng() * 0.35)
    return {
      ...f,
      position_x: Math.max(8, Math.min(92, cx + Math.cos(angle) * radius)),
      position_y: Math.max(8, Math.min(92, cy + Math.sin(angle) * radius * 0.85)),
    }
  })
}

function arrangeVase(flowers: BouquetFlower[], width: number, height: number, rng: () => number): BouquetFlower[] {
  const cx = width / 2
  const baseY = height * 0.72

  return flowers.map((f, i) => {
    const angle = (i / Math.max(flowers.length, 1)) * Math.PI * 2 + (rng() - 0.5) * 0.5
    const radius = 6 + rng() * 16
    const heightVar = rng() * 30
    return {
      ...f,
      position_x: Math.max(8, Math.min(92, cx + Math.cos(angle) * radius)),
      position_y: Math.max(8, Math.min(88, baseY - 8 - heightVar)),
    }
  })
}

function arrangeHeart(flowers: BouquetFlower[], width: number, height: number, rng: () => number): BouquetFlower[] {
  const cx = width / 2
  const cy = height * 0.36
  const scale = Math.min(width, height) * 0.016

  return flowers.map((f, i) => {
    const t = (i / Math.max(flowers.length, 1)) * Math.PI * 2
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    return {
      ...f,
      position_x: Math.max(8, Math.min(92, cx + hx * scale + (rng() - 0.5) * 4)),
      position_y: Math.max(8, Math.min(88, cy + hy * scale + (rng() - 0.5) * 4)),
    }
  })
}

function applyArrangement(
  flowers: BouquetFlower[],
  type: ArrangementType,
  width: number,
  height: number,
  rng: () => number
): BouquetFlower[] {
  switch (type) {
    case 'random':
      return arrangeRandom(flowers, width, height, rng)
    case 'circular':
      return arrangeCircular(flowers, width, height, rng)
    case 'vase':
      return arrangeVase(flowers, width, height, rng)
    case 'heart':
      return arrangeHeart(flowers, width, height, rng)
    default:
      return arrangeRandom(flowers, width, height, rng)
  }
}

function autoArrange(flowers: BouquetFlower[], iterations: number = 40): BouquetFlower[] {
  let result = [...flowers]
  const minDist = 15

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

// --- Component ---
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
    const arranged = applyArrangement(newFlowers, arrangement, containerSize.width, containerSize.height, rng)
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
    const arranged = applyArrangement(localFlowers, type, containerSize.width, containerSize.height, rng)
    setLocalFlowers(arranged)
  }

  const arrangements: { type: ArrangementType; label: string; icon: React.ReactNode }[] = [
    { type: 'random', label: 'Random', icon: <Shuffle className="w-4 h-4" /> },
    { type: 'circular', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
    { type: 'vase', label: 'Vase', icon: <Flower2 className="w-4 h-4" /> },
    { type: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  ]

  const displayFlowers = localFlowers.length > 0 ? localFlowers : flowers

  return (
    <motion.div
      ref={containerRef}
      className="relative rounded-3xl bg-gradient-to-br from-cream-50 via-white to-blush-50 p-4 sm:p-8 overflow-hidden"
      style={{ minHeight: '500px' }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.05 } }
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(isMobile ? 4 : 8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-200/30 text-3xl sm:text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            ♡
          </motion.div>
        ))}
      </div>

      {/* Vase */}
      <motion.div
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-16 sm:h-24 text-rose-200/60"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        <svg viewBox="0 0 128 128" className="w-full h-full">
          <path
            d="M40 100 L24 24 Q64 12 104 24 L88 100 Z"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <ellipse cx="64" cy="24" rx="36" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="64" cy="100" rx="20" ry="6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* Controls */}
      {isEditing && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-rose-100 p-2 sm:p-3 flex flex-wrap items-center gap-2">
            {/* Arrangement buttons */}
            <div className="flex gap-1">
              {arrangements.map(arr => (
                <button
                  key={arr.type}
                  onClick={() => handleArrangementChange(arr.type)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center ${
                    arrangement === arr.type
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {arr.icon}
                  <span className="ml-1 hidden sm:inline">{arr.label}</span>
                </button>
              ))}
            </div>

            {/* Flower count slider */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-rose-600 font-medium whitespace-nowrap">Count</label>
              <input
                type="range"
                min="3"
                max="20"
                value={flowerCount}
                onChange={(e) => setFlowerCount(Number(e.target.value))}
                className="w-16 sm:w-20 h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-xs text-rose-500 w-4 text-center">{flowerCount}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleAutoArrange}
                className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center"
              >
                <SlidersHorizontal className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Auto-arrange</span>
              </button>
              <button
                onClick={handleRegenerate}
                className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flowers */}
      <AnimatePresence mode="popLayout">
        {displayFlowers.map((flower, index) => {
          const seed = flower.generation_seed || parseInt(flower.id.slice(-6), 36)
          const stemRng = createRng(seed)
          const stemHeight = 100 + Math.floor(stemRng() * 50)

          return (
            <motion.div
              key={flower.id}
              className="absolute cursor-pointer select-none"
              style={{
                left: `${flower.position_x}%`,
                top: `${flower.position_y}%`,
                transform: `translate(-50%, -100%) rotate(${flower.rotation}deg) scale(${flower.scale})`,
                zIndex: index + 10,
              }}
              initial={{ y: 200, opacity: 0, rotate: -90, scale: 0 }}
              animate={{ y: 0, opacity: 1, rotate: flower.rotation, scale: flower.scale }}
              exit={{ y: -100, opacity: 0, scale: 0, rotate: 90 }}
              transition={{
                delay: 0.1 * index,
                duration: 0.6,
                type: 'spring',
                stiffness: 120,
                damping: 15,
              }}
              onClick={(e) => handleFlowerClick(flower, e)}
              draggable={isEditing}
              onDrag={(e) => handleDrag(flower, e)}
              onDragEnd={() => handleDragEnd(flower)}
              whileHover={isEditing ? {} : { scale: (flower.scale || 1) * 1.1, rotate: flower.rotation + 5 }}
              whileTap={isEditing ? {} : { scale: (flower.scale || 1) * 0.95 }}
            >
              {/* Stem */}
              <motion.div
                className="flower-stem"
                style={{ height: `${stemHeight}px` }}
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{
                  duration: 3 + (seed % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Flower Head */}
              <motion.div
                className="flex items-center justify-center"
                style={{
                  filter: `drop-shadow(0 4px 12px ${flower.color}60)`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 4 + (seed % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  className="animate-sway"
                  style={{
                    transformOrigin: 'bottom center',
                    animationDuration: `${3 + ((seed + 1) % 3)}s`,
                  }}
                >
                  <ProceduralFlower
                    type={flower.flower_type}
                    color={flower.color}
                    seed={seed}
                    size={Math.round(75 * (flower.scale || 1))}
                    simplified={isMobile}
                  />
                </div>
              </motion.div>

              {/* Note indicator */}
              {flower.note && !isEditing && (
                <motion.div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-medium shadow-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + 0.1 * index, type: 'spring' }}
                >
                  <MessageSquare className="w-3 h-3" aria-hidden="true" />
                  <span>Note</span>
                </motion.div>
              )}

              {/* Edit controls */}
              {isEditing && (
                <div className="absolute -top-10 -right-4 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFlower?.(flower.id)
                    }}
                    className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    aria-label="Remove flower"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFlower(flower)
                    }}
                    className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors"
                    aria-label="Edit flower note"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Add flower button */}
      {isEditing && onAddFlower && (
        <motion.button
          onClick={onAddFlower}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-rose-100 text-rose-600 font-medium hover:bg-rose-200 transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span>Add Flower</span>
        </motion.button>
      )}

      {/* Note Modal */}
      <AnimatePresence>
        {selectedFlower && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFlower(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-title"
          >
            <motion.div
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 transform-style-3d"
              initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotateY: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-4xl"
                    style={{ color: selectedFlower.color }}
                    role="img"
                    aria-label={FLOWER_CONFIG[selectedFlower.flower_type].name}
                  >
                    {FLOWER_CONFIG[selectedFlower.flower_type].emoji}
                  </span>
                  <div>
                    <h3 id="note-title" className="font-serif text-xl font-semibold text-rose-900">
                      {FLOWER_CONFIG[selectedFlower.flower_type].name}
                    </h3>
                    <p className="text-rose-500 text-sm capitalize">{selectedFlower.color}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFlower(null)}
                  className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                  aria-label="Close note"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-cream-50 rounded-2xl p-6 border border-rose-100">
                <p className="font-handwriting text-lg text-rose-700 leading-relaxed whitespace-pre-wrap">
                  {selectedFlower.note}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-rose-100 flex items-center justify-end gap-2 text-rose-400 text-sm">
                <Heart className="w-4 h-4 animate-heartbeat" aria-hidden="true" />
                <span>Sent with love</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

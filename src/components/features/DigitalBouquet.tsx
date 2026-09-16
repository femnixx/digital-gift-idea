'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Heart, X, MessageSquare, Sparkles } from 'lucide-react'
import { FLOWER_CONFIG, type FlowerType } from '@/types'

interface BouquetFlower {
  id: string
  flower_type: FlowerType
  color: string
  note: string | null
  position_x: number
  position_y: number
  rotation: number
  scale: number
}

interface DigitalBouquetProps {
  flowers: BouquetFlower[]
  onFlowerClick?: (flower: BouquetFlower) => void
  isEditing?: boolean
  onAddFlower?: () => void
  onRemoveFlower?: (id: string) => void
  onUpdateFlower?: (id: string, updates: Partial<BouquetFlower>) => void
}

const flowerIcons: Record<FlowerType, string> = {
  rose: '🌹',
  sunflower: '🌻',
  tulip: '🌷',
  lily: '🌸',
  orchid: '🌺',
  peony: '💮',
  daisy: '🌼',
  lavender: '🪻',
}

export function DigitalBouquet({
  flowers,
  onFlowerClick,
  isEditing = false,
  onAddFlower,
  onRemoveFlower,
  onUpdateFlower,
}: DigitalBouquetProps) {
  const [selectedFlower, setSelectedFlower] = useState<BouquetFlower | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 400, height: 500 })

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

  const handleFlowerClick = (flower: BouquetFlower, e: React.MouseEvent) => {
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
    // Add slight rotation on drop
    onUpdateFlower?.(flower.id, {
      rotation: Math.random() * 10 - 5,
    })
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative rounded-3xl bg-gradient-to-br from-cream-50 via-white to-blush-50 p-8 overflow-hidden"
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
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-200/30 text-4xl"
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-24"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        <svg viewBox="0 0 128 128" className="w-full h-full text-rose-200">
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

      {/* Flowers */}
      <AnimatePresence mode="popLayout">
        {flowers.map((flower, index) => (
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
            whileHover={isEditing ? {} : { scale: flower.scale * 1.1, rotate: flower.rotation + 5 }}
            whileTap={isEditing ? {} : { scale: flower.scale * 0.95 }}
          >
            {/* Stem */}
            <motion.div
              className="flower-stem"
              style={{
                height: `${120 + Math.random() * 60}px`,
                transformOrigin: 'bottom center',
              }}
              animate={{
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
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
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span 
                className="text-5xl md:text-6xl lg:text-7xl filter drop-shadow-lg"
                style={{ color: flower.color }}
                role="img"
                aria-label={FLOWER_CONFIG[flower.flower_type].name}
              >
                {flowerIcons[flower.flower_type]}
              </span>
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
        ))}
      </AnimatePresence>

      {/* Add flower button */}
      {isEditing && onAddFlower && (
        <motion.button
          onClick={onAddFlower}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-rose-100 text-rose-600 font-medium hover:bg-rose-200 transition-all shadow-lg"
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
                    {flowerIcons[selectedFlower.flower_type]}
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
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, Eye, EyeOff, Edit3 } from 'lucide-react'

interface ScratchCardProps {
  coverColor: string
  coverImageUrl?: string | null
  revealContent: {
    type: 'text' | 'image'
    content: string
  }
  scratchThreshold?: number
  brushSize?: number
  onReveal?: () => void
  className?: string
  onEdit?: () => void
  isEditing?: boolean
}

export function ScratchCard({
  coverColor,
  coverImageUrl,
  revealContent,
  scratchThreshold = 0.6,
  brushSize = 30,
  onReveal,
  className = '',
  onEdit,
  isEditing = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isScratching, setIsScratching] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const animationFrameRef = useRef<number>()

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    return ctx
  }, [])

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    // Draw cover
    if (coverImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = coverImageUrl
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        // Add scratch overlay
        drawScratchOverlay(ctx, rect.width, rect.height)
      }
    } else {
      // Solid color with pattern
      ctx.fillStyle = coverColor
      ctx.fillRect(0, 0, rect.width, rect.height)
      drawScratchOverlay(ctx, rect.width, rect.height)
    }
  }, [coverColor, coverImageUrl])

  const drawScratchOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw a subtle pattern on top
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2)
        }
      }
    }
  }

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    const canvasX = (x - rect.left) * dpr
    const canvasY = (y - rect.top) * dpr

    // Scratch effect - clear with destination-out
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(canvasX, canvasY, brushSize * dpr, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Calculate progress
    calculateProgress()
  }, [brushSize])

  const calculateProgress = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentPixels = 0
    const totalPixels = pixels.length / 4

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++
    }

    const progress = transparentPixels / totalPixels
    setScratchProgress(progress)

    if (progress >= scratchThreshold && !isRevealed) {
      setIsRevealed(true)
      onReveal?.()
      
      // Animate full reveal
      setTimeout(() => {
        setShowContent(true)
      }, 300)
    }
  }, [scratchThreshold, isRevealed, onReveal])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isRevealed) return
    setIsScratching(true)
    scratch(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching || isRevealed) return
    scratch(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    setIsScratching(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRevealed) return
    setIsScratching(true)
    const touch = e.touches[0]
    scratch(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScratching || isRevealed) return
    e.preventDefault()
    const touch = e.touches[0]
    scratch(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    setIsScratching(false)
  }

  useEffect(() => {
    initializeCanvas()
    window.addEventListener('resize', initializeCanvas)
    return () => {
      window.removeEventListener('resize', initializeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initializeCanvas])

  // Confetti on reveal
  useEffect(() => {
    if (isRevealed && !showContent) {
      // Trigger confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0284c7', '#7dd3fc', '#bae6fd', '#f0f9ff', '#ffffff'],
            shapes: ['heart'] as any,
            scalar: 1.2,
          })
        })
      }
    }
  }, [isRevealed, showContent])

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${className}`}
      style={{ 
        aspectRatio: '4/3',
        maxWidth: '400px',
        margin: '0 auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isRevealed) setIsRevealed(true)
        }
      }}
      aria-label={isRevealed ? 'Scratch card revealed' : 'Scratch to reveal'}
    >
      {/* Revealed Content */}
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: 'power2.out' }}
          >
            <div className="relative w-full h-full max-w-md">
              {revealContent.type === 'image' ? (
                <motion.img
                  src={revealContent.content}
                  alt="Revealed surprise"
                  className="w-full h-full object-cover rounded-lg border border-stone-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
              ) : (
                <motion.div
                  className="w-full h-full bg-stone-50 rounded-lg p-8 flex items-center justify-center text-center border border-stone-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="max-w-xs">
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-600 text-sm font-medium mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <Heart className="w-4 h-4" aria-hidden="true" />
                      <span>For You</span>
                    </motion.div>
                    <motion.p
                      className="font-handwriting text-2xl md:text-3xl text-sky-600 leading-relaxed whitespace-pre-wrap"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                    >
                      {revealContent.content}
                    </motion.p>
                    <motion.div
                      className="mt-6 flex items-center justify-center gap-2 text-stone-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <span className="font-handwriting text-lg">Made with love</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scratch Canvas */}
      <AnimatePresence mode="wait">
        {!showContent && (
          <motion.canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: isRevealed ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ pointerEvents: isRevealed ? 'none' : 'auto' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {!isRevealed && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 text-stone-800 text-sm border border-stone-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(scratchProgress / scratchThreshold, 1) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <span>{Math.round(scratchProgress * 100)}%</span>
        </motion.div>
      )}

      {/* Hint overlay */}
      {!isRevealed && !isScratching && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none"
        >
          <motion.div
            className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center mb-3 border border-stone-200"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg
              className="w-6 h-6 text-sky-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20M17 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <p className="font-handwriting text-lg text-stone-500 text-center">
            Scratch to reveal your surprise
          </p>
        </div>
      )}

      {/* Edit button */}
      {isEditing && onEdit && !isRevealed && (
        <motion.button
          type="button"
          onClick={onEdit}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-sky-600 hover:bg-stone-100 transition-colors z-10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Edit scratch card"
        >
          <Edit3 className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      )}
    </div>
  )
}

// Scratch Card Grid for multiple cards
interface ScratchCardGridProps {
  cards: ScratchCardProps[]
  columns?: number
}

export function ScratchCardGrid({ cards, columns = 2 }: ScratchCardGridProps) {
  return (
    <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="group"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <ScratchCard {...card} />
        </motion.div>
      ))}
    </div>
  )
}
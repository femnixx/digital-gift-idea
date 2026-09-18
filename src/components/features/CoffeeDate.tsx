'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Coffee, Heart, Sparkles, Gift, ArrowRight, Check } from 'lucide-react'
import { DRINK_CONFIG, type DrinkType } from '@/types'

interface CoffeeDate {
  id: string
  drink_types: DrinkType[]
  custom_name: string | null
  message: string | null
  gift_card_url: string | null
  local_cafe_suggestion: string | null
  animation_triggered: boolean
}

interface CoffeeDateProps {
  date: CoffeeDate
  onRedeem?: (url: string) => void
  className?: string
}

export function CoffeeDateWidget({ date, onRedeem, className = '' }: CoffeeDateProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const cupRef = useRef<HTMLDivElement>(null)
  const heartsRef = useRef<HTMLDivElement>(null)
  const steamRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLDivElement>(null)

  const primaryDrink = date.drink_types.length > 0 ? DRINK_CONFIG[date.drink_types[0]] : DRINK_CONFIG.coffee

  const rotateX = useTransform(useSpring(mousePos.y, { stiffness: 400, damping: 30 }), [-1, 1], [10, -10])
  const rotateY = useTransform(useSpring(mousePos.x, { stiffness: 400, damping: 30 }), [-1, 1], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 2 - 1
    const y = (e.clientY - rect.top) / rect.height * 2 - 1
    setMousePos({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 })
  }

  const runPreparationAnimation = () => {
    if (!cupRef.current) return
    setIsPreparing(true)

    const tl = gsap.timeline({
      onComplete: () => {
        setIsPreparing(false)
        setIsAnimating(true)
        setShowConfetti(true)
        
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [primaryDrink.color, '#0284c7', '#7dd3fc', '#bae6fd', '#ffffff'],
            shapes: ['heart', 'circle'] as any,
            scalar: 1.8,
          })
        })

        setTimeout(() => {
          setIsAnimating(false)
          if (date.gift_card_url) {
            onRedeem?.(date.gift_card_url)
            window.open(date.gift_card_url, '_blank')
          }
        }, 2000)
      }
    })

    tl.to(cupRef.current, { scale: 0.95, duration: 0.3, ease: 'power2.in' })
      .to(cupRef.current, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
      .to(cupRef.current, { rotate: 360, duration: 1, ease: 'power2.inOut' }, '<')
      .to({}, { duration: 0.5 })
  }

  const handleRedeem = () => {
    runPreparationAnimation()
  }

  useEffect(() => {
    if (!isAnimating || !heartsRef.current) return

    const hearts = heartsRef.current.querySelectorAll('.heart-particle')
    hearts.forEach((heart, i) => {
      gsap.fromTo(heart, 
        { y: 0, opacity: 0, scale: 0 },
        { 
          y: -120, 
          opacity: 0.8, 
          scale: 1, 
          duration: 2 + Math.random(), 
          delay: i * 0.15,
          ease: 'power1.out',
          repeat: -1,
          repeatDelay: 1 + Math.random() * 2
        }
      )
    })
  }, [isAnimating])

  useEffect(() => {
    if (!isAnimating || !steamRef.current) return

    const steamParticles = steamRef.current.querySelectorAll('.steam-particle')
    steamParticles.forEach((particle, i) => {
      gsap.fromTo(particle,
        { y: 0, opacity: 0.8, scale: 0.5 },
        {
          y: -40,
          opacity: 0,
          scale: 1.5,
          duration: 2,
          delay: i * 0.3,
          ease: 'power1.out',
          repeat: -1,
          repeatDelay: 0.5
        }
      )
    })
  }, [isAnimating])

  const getDrinkName = () => {
    if (date.custom_name) return date.custom_name
    if (date.drink_types.length === 1) return DRINK_CONFIG[date.drink_types[0]].name
    return `${date.drink_types.length} Drinks`
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card p-6 relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ perspective: 1000 }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-cream-50 to-transparent" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-sky-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" aria-hidden="true" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Drink Visualization */}
        <motion.div
          ref={cupRef}
          className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          animate={{ 
            y: isAnimating ? -15 : 0,
            rotateZ: isAnimating ? [0, 5, -5, 0] : 0,
          }}
          transition={{ 
            y: { duration: 0.6, ease: 'easeOut' },
            rotateZ: { duration: 1, repeat: isAnimating ? Infinity : 0, repeatDelay: 2 }
          }}
        >
          {/* Main Cup */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-28 relative">
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-white rounded-b-2xl border-4"
              style={{ borderColor: primaryDrink.color }}
            />
            <div 
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-24 h-4 bg-white border-4 border-t-0 rounded-t-xl"
              style={{ borderColor: primaryDrink.color }}
            />
            
            {/* Handle */}
            <div 
              className="absolute right-0 top-4 w-4 h-10 border-4 border-r-0 rounded-r-xl"
              style={{ borderColor: primaryDrink.color }}
            />
            
            {/* Liquid */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 rounded-b-xl"
              style={{ backgroundColor: primaryDrink.color }}
              initial={{ height: 0 }}
              animate={{ height: isPreparing ? [0, 20, 20] : 20 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              {/* Steam */}
              <div ref={steamRef} className="absolute -top-4 left-1/2 -translate-x-1/2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="steam-particle absolute top-0 w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: primaryDrink.steamColor,
                      left: `${i * 6 - 6}px`
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Drink emoji floating */}
          {date.drink_types.length > 0 && (
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl md:text-5xl"
              animate={{ 
                y: isAnimating ? [-50, -60, -50] : 0,
                opacity: isAnimating ? 1 : 0.7,
              }}
              transition={{ 
                y: { duration: 2, repeat: isAnimating ? Infinity : 0, ease: 'easeInOut' },
                opacity: { duration: 0.3 }
              }}
            >
              {primaryDrink.emoji}
            </motion.div>
          )}

          {/* Additional drink indicators */}
          {date.drink_types.length > 1 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex -space-x-2">
              {date.drink_types.slice(0, 3).map((drink, i) => (
                <span key={drink} className="text-lg bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-slate-200">
                  {DRINK_CONFIG[drink].emoji}
                </span>
              ))}
              {date.drink_types.length > 3 && (
                <span className="text-xs bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center text-slate-600">
                  +{date.drink_types.length - 3}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Drink Info */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Coffee className="w-4 h-4" aria-hidden="true" />
            <span>{getDrinkName()}</span>
          </motion.div>

          <motion.h3
            className="font-serif text-2xl md:text-3xl font-semibold text-sky-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A Virtual Coffee Date ☕
          </motion.h3>

          {date.message && (
            <motion.p
              className="font-handwriting text-lg text-sky-600 leading-relaxed mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              "{date.message}"
            </motion.p>
          )}

          {date.local_cafe_suggestion && (
            <motion.div
              className="p-3 rounded-xl bg-white/80 backdrop-blur border border-sky-100 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sky-500 text-sm uppercase tracking-wider mb-1">Suggested Spot</p>
              <p className="font-medium text-sky-800">{date.local_cafe_suggestion}</p>
            </motion.div>
          )}

          {/* Drink list */}
          {date.drink_types.length > 1 && (
            <motion.div
              className="flex flex-wrap gap-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {date.drink_types.map(drink => (
                <span 
                  key={drink} 
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-sky-200 text-xs text-sky-700"
                >
                  {DRINK_CONFIG[drink].emoji} {DRINK_CONFIG[drink].name}
                </span>
              ))}
            </motion.div>
          )}

          {/* Redeem Button */}
          {date.gift_card_url && !date.animation_triggered ? (
            <motion.button
              onClick={handleRedeem}
              className="btn-primary group w-full md:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              disabled={isPreparing}
            >
              {isPreparing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" aria-hidden="true" />
                  <span>Redeem Your Treat</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </>
              )}
            </motion.button>
          ) : date.animation_triggered ? (
            <motion.div
              className="btn bg-green-500 text-white w-full md:w-auto flex items-center justify-center gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>Enjoy your treat! 🎉</span>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Floating hearts */}
      <div ref={heartsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {isAnimating && [...Array(8)].map((_, i) => (
          <div
            key={i}
            className="heart-particle absolute text-sky-400/60 text-xl"
            style={{
              left: `${10 + Math.random() * 80}%`,
              bottom: '15%',
            }}
          >
            ♡
          </div>
        ))}
      </div>

      {/* Confetti overlay */}
      {showConfetti && (
        <motion.div
          ref={confettiRef}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 1 }}
        />
      )}
    </motion.div>
  )
}

// Grid for multiple coffee dates
export function CoffeeDateGrid({ dates, onRedeem }: { dates: CoffeeDate[]; onRedeem?: (url: string) => void }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((date, index) => (
        <motion.div
          key={date.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <CoffeeDateWidget date={date} onRedeem={onRedeem} />
        </motion.div>
      ))}
    </div>
  )
}

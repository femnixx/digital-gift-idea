'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Coffee, Heart, Sparkles, Gift, ArrowRight, Check } from 'lucide-react'
import { DRINK_CONFIG, type DrinkType } from '@/types'

interface CoffeeDate {
  id: string
  drink_type: DrinkType
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
  const drink = DRINK_CONFIG[date.drink_type]

  const handleRedeem = () => {
    setIsAnimating(true)
    setShowConfetti(true)
    
    // Trigger confetti
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: [drink.color, '#f43f5e', '#fb7185', '#fda4af', '#ffffff'],
        shapes: ['heart', 'circle'] as any,
        scalar: 1.5,
      })
    })

    setTimeout(() => {
      setIsAnimating(false)
      if (date.gift_card_url) {
        onRedeem?.(date.gift_card_url)
        window.open(date.gift_card_url, '_blank')
      }
    }, 1500)
  }

  return (
    <motion.div
      className={`card p-6 relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-cream-50 to-transparent" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" aria-hidden="true" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Drink Visualization */}
        <motion.div
          className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
          animate={{ y: isAnimating ? -20 : 0, rotate: isAnimating ? 10 : 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {/* Cup */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-28 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-white rounded-b-2xl border-4" style={{ borderColor: drink.color }} />
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-24 h-4 bg-white border-4 border-t-0 rounded-t-xl" style={{ borderColor: drink.color }} />
            
            {/* Handle */}
            <div className="absolute right-0 top-4 w-4 h-10 border-4 border-r-0 rounded-r-xl" style={{ borderColor: drink.color }} />
            
            {/* Liquid */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-20 rounded-b-xl"
              style={{ backgroundColor: drink.color }}
              initial={{ height: 0 }}
              animate={{ height: isAnimating ? '20px' : '20px' }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {/* Steam */}
              <AnimatePresence>
                {isAnimating && [...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: drink.steamColor }}
                    initial={{ opacity: 1, y: 0, scale: 0.5 }}
                    animate={{ opacity: 0, y: -30, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Drink emoji floating */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 text-5xl"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: isAnimating ? -50 : 0, opacity: isAnimating ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            {drink.emoji}
          </motion.div>
        </motion.div>

        {/* Drink Info */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Coffee className="w-4 h-4" aria-hidden="true" />
            <span>{date.custom_name || drink.name}</span>
          </motion.div>

          <motion.h3
            className="font-serif text-2xl md:text-3xl font-semibold text-rose-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A Virtual Coffee Date ☕
          </motion.h3>

          {date.message && (
            <motion.p
              className="font-handwriting text-lg text-rose-600 leading-relaxed mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              "{date.message}"
            </motion.p>
          )}

          {date.local_cafe_suggestion && (
            <motion.div
              className="p-3 rounded-xl bg-white/80 backdrop-blur border border-rose-100 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-rose-500 text-sm uppercase tracking-wider mb-1">Suggested Spot</p>
              <p className="font-medium text-rose-800">{date.local_cafe_suggestion}</p>
            </motion.div>
          )}

          {/* Redeem Button */}
          <AnimatePresence>
            {date.gift_card_url && !date.animation_triggered ? (
              <motion.button
                onClick={handleRedeem}
                className="btn-primary group w-full md:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Gift className="w-5 h-5" aria-hidden="true" />
                <span>Redeem Your Treat</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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
          </AnimatePresence>
        </div>
      </div>

      {/* Floating hearts */}
      <AnimatePresence>
        {isAnimating && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-400/60 text-xl pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '20%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: -100, x: (Math.random() - 0.5) * 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.1, ease: 'easeOut' }}
          >
            ♡
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Confetti overlay */}
      {showConfetti && (
        <motion.div
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



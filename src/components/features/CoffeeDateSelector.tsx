'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { Coffee, Heart, Gift, Sparkles, Check, Box } from 'lucide-react'
import { DRINK_CONFIG, type DrinkType, type CoffeeDate as AppCoffeeDate, type CoffeeDateFormData } from '@/types'
import { db } from '@/lib/storage/localStorageDB'
import type { Entry } from '@/types'
import { Coffee3DPreview } from '@/components/features/Coffee3DPreview'

interface CoffeeDateSelectorProps {
  entryId?: string
  existingDates?: AppCoffeeDate[]
  onSave?: (dates: AppCoffeeDate[]) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

const DRINK_ORDER: DrinkType[] = [
  'espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'cold_brew', 'coffee', 'tea', 'hot_chocolate', 'matcha', 'chai'
]

interface DrinkCardProps {
  drinkType: DrinkType
  isSelected: boolean
  onToggle: () => void
  index: number
}

function DrinkCard({ drinkType, isSelected, onToggle, index }: DrinkCardProps) {
  const drink = DRINK_CONFIG[drinkType]
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current, 
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, delay: index * 0.05, ease: 'power2.out' }
    )
  }, [index])

  const getCupSvg = () => {
    const baseColor = drink.color
    switch (drinkType) {
      case 'espresso':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="35" width="24" height="25" rx="2" fill={baseColor} opacity="0.8" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'americano':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.6" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'latte':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.7" />
            <circle cx="30" cy="38" r="6" fill="#fff" opacity="0.4" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'cappuccino':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="25" rx="2" fill={baseColor} opacity="0.8" />
            <circle cx="30" cy="40" r="8" fill="#fff" opacity="0.5" />
            <circle cx="26" cy="36" r="4" fill="#fff" opacity="0.3" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'mocha':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.8" />
            <path d="M25 35 Q30 32 35 35 Q30 38 25 35" fill="#fff" opacity="0.3" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'cold_brew':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="25" width="30" height="40" rx="2" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="35" width="24" height="25" rx="2" fill={baseColor} opacity="0.7" />
            <rect x="22" y="20" width="16" height="6" rx="1" fill="#fff" stroke={baseColor} strokeWidth="2" />
            <path d="M42 35 Q50 35 50 42 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <line x1="20" y1="50" x2="40" y2="50" stroke={baseColor} strokeWidth="2" opacity="0.3" />
          </svg>
        )
      case 'coffee':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.8" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'tea':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.7" />
            <circle cx="25" cy="38" r="3" fill="#fff" opacity="0.4" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'hot_chocolate':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.8" />
            <circle cx="28" cy="40" r="5" fill="#fff" opacity="0.3" />
            <circle cx="34" cy="45" r="3" fill="#fff" opacity="0.3" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'matcha':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.7" />
            <circle cx="30" cy="42" r="6" fill="#fff" opacity="0.3" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      case 'chai':
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.7" />
            <circle cx="26" cy="38" r="2" fill="#fff" opacity="0.4" />
            <circle cx="34" cy="42" r="2" fill="#fff" opacity="0.4" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 60 80" className="w-12 h-12">
            <rect x="15" y="20" width="30" height="45" rx="4" fill="#fff" stroke={baseColor} strokeWidth="3" />
            <rect x="18" y="30" width="24" height="30" rx="2" fill={baseColor} opacity="0.8" />
            <path d="M42 30 Q50 30 50 40 Q50 50 42 50" fill="none" stroke={baseColor} strokeWidth="3" />
            <rect x="20" y="15" width="20" height="8" rx="2" fill="#fff" stroke={baseColor} strokeWidth="2" />
          </svg>
        )
    }
  }

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
        isSelected
          ? 'border-sky-400 bg-sky-50 shadow-lg shadow-sky-200/50'
          : 'border-slate-200 bg-white hover:border-sky-200 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          {getCupSvg()}
        </div>
        <div>
          <h3 className="font-serif font-semibold text-slate-800 text-sm">{drink.name}</h3>
          <p className="text-xs text-slate-500 mt-1">{drink.description}</p>
          <p className="text-xs font-medium text-sky-600 mt-1">{drink.priceSuggestion}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function CoffeeDateSelector({ entryId, existingDates = [], onSave, onCancel, mode = 'create' }: CoffeeDateSelectorProps) {
  const [selectedDrinks, setSelectedDrinks] = useState<DrinkType[]>([])
  const [customName, setCustomName] = useState('')
  const [message, setMessage] = useState('')
  const [giftCardUrl, setGiftCardUrl] = useState('')
  const [cafeSuggestion, setCafeSuggestion] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [is3D, setIs3D] = useState(false)
  
  const previewRef = useRef<HTMLDivElement>(null)
  const cupRefs = useRef<(HTMLDivElement | null)[]>([])
  const steamRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (existingDates.length > 0 && mode === 'edit') {
      const existing = existingDates[0]
      setSelectedDrinks(existing.drink_types)
      setCustomName(existing.custom_name || '')
      setMessage(existing.message || '')
      setGiftCardUrl(existing.gift_card_url || '')
      setCafeSuggestion(existing.local_cafe_suggestion || '')
    }
  }, [existingDates, mode])

  const toggleDrink = (drink: DrinkType) => {
    setSelectedDrinks(prev => 
      prev.includes(drink) 
        ? prev.filter(d => d !== drink)
        : [...prev, drink]
    )
  }

  const runPreviewAnimation = () => {
    if (!previewRef.current || selectedDrinks.length === 0) return
    setIsPreviewing(true)

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(previewRef.current, { opacity: 0, duration: 0.3, onComplete: () => setIsPreviewing(false) })
      }
    })

    tl.set(previewRef.current, { opacity: 1 })
    
    cupRefs.current.forEach((cup, i) => {
      if (!cup) return
      const drink = DRINK_CONFIG[selectedDrinks[i]]
      tl.fromTo(cup, 
        { y: 50, opacity: 0, rotation: -10 },
        { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' },
        i * 0.2
      )
    })

    steamRefs.current.forEach((steam, i) => {
      if (!steam) return
      const drinkIndex = Math.floor(i / 3)
      tl.to(steam, {
        y: -20,
        opacity: 0,
        scale: 1.5,
        duration: 1.5,
        ease: 'power1.out',
        repeat: 1,
        yoyo: true,
      }, 0.5 + drinkIndex * 0.2)
    })

    tl.to({}, { duration: 2 })
  }

  const handleSave = () => {
    if (selectedDrinks.length === 0) return
    setIsSaving(true)

    const coffeeDateData: Omit<AppCoffeeDate, 'id' | 'entry_id' | 'created_at'> = {
      drink_types: selectedDrinks,
      custom_name: customName || null,
      message: message || null,
      gift_card_url: giftCardUrl || null,
      local_cafe_suggestion: cafeSuggestion || null,
      animation_triggered: false,
    }

    const newCoffeeDate: AppCoffeeDate = {
      id: Math.random().toString(36).substring(2, 15),
      entry_id: entryId || '',
      ...coffeeDateData,
      created_at: new Date().toISOString(),
    }

    if (mode === 'edit' && existingDates.length > 0) {
      const updated = { ...existingDates[0], ...newCoffeeDate }
      if (entryId) {
        const entry = db.entries.get(entryId)
        if (entry) {
          const updatedDates = entry.coffee_dates?.map((d: AppCoffeeDate) => d.id === updated.id ? updated : d) || [updated]
          db.entries.update(entryId, { coffee_dates: updatedDates })
        }
      }
      onSave?.([updated])
    } else {
      if (entryId) {
        const entry = db.entries.get(entryId)
        if (entry) {
          const updatedDates = [...(entry.coffee_dates || []), newCoffeeDate]
          db.entries.update(entryId, { coffee_dates: updatedDates })
        }
      }
      onSave?.([newCoffeeDate])
    }

    setIsSaving(false)
  }

  const getPrimaryDrink = () => {
    return selectedDrinks.length > 0 ? DRINK_CONFIG[selectedDrinks[0]] : null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Drink Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Coffee className="w-6 h-6 text-sky-500" />
          <h2 className="font-serif text-xl font-semibold text-slate-800">Choose Your Drinks</h2>
        </div>
        <p className="text-slate-500 text-sm mb-6">Select one or more drinks to create the perfect coffee date arrangement</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {DRINK_ORDER.map((drink, i) => (
            <DrinkCard
              key={drink}
              drinkType={drink}
              isSelected={selectedDrinks.includes(drink)}
              onToggle={() => toggleDrink(drink)}
              index={i}
            />
          ))}
        </div>

        {selectedDrinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-100"
          >
            <p className="text-sm text-sky-700 font-medium mb-2">Selected arrangement:</p>
            <div className="flex flex-wrap gap-2">
              {selectedDrinks.map(drink => (
                <span key={drink} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-sky-200 text-sm text-sky-700">
                  {DRINK_CONFIG[drink].emoji} {DRINK_CONFIG[drink].name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-sky-500" />
          <h2 className="font-serif text-xl font-semibold text-slate-800">Personalize</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Custom Name (optional)</label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g., Morning Latte Date"
              className="input"
            />
          </div>

          <div>
            <label className="label">Sweet Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write a heartfelt message..."
              className="textarea"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Gift Card URL (optional)</label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="url"
                value={giftCardUrl}
                onChange={e => setGiftCardUrl(e.target.value)}
                placeholder="https://gift.starbucks.com/..."
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Local Cafe Suggestion (optional)</label>
            <input
              type="text"
              value={cafeSuggestion}
              onChange={e => setCafeSuggestion(e.target.value)}
              placeholder="e.g., Blue Bottle on Main St"
              className="input"
            />
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      {selectedDrinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-sky-500" />
              <h2 className="font-serif text-xl font-semibold text-slate-800">Preview</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIs3D(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors`}
              >
                2D
              </button>
              <button
                onClick={() => setIs3D(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1`}
              >
                <Box className="w-3 h-3" />
                3D
              </button>
              <button
                onClick={runPreviewAnimation}
                className="btn-secondary text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Animate
              </button>
            </div>
          </div>

          <div ref={previewRef} className="relative py-8">
            {is3D && selectedDrinks.length > 0 ? (
              <Coffee3DPreview drinkType={selectedDrinks[0]} />
            ) : (
              <>
                {isPreviewing && (
                  <div className="flex flex-wrap justify-center gap-6">
                    {selectedDrinks.map((drink, i) => (
                      <div key={drink} className="relative">
                        <div
                          ref={el => { cupRefs.current[i] = el; return undefined }}
                          className="relative w-24 h-28"
                        >
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-white rounded-b-2xl border-4" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-24 h-4 bg-white border-4 border-t-0 rounded-t-xl" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute right-0 top-4 w-4 h-10 border-4 border-r-0 rounded-r-xl" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-b-xl" style={{ backgroundColor: DRINK_CONFIG[drink].color }} />
                          {[...Array(3)].map((_, j) => (
                            <div
                              key={j}
                              ref={el => { if (i === 0 && j === 0) steamRefs.current[0] = el; if (i === 1 && j === 0) steamRefs.current[3] = el }}
                              className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{ backgroundColor: DRINK_CONFIG[drink].steamColor }}
                            />
                          ))}
                        </div>
                        <p className="text-center text-xs text-slate-600 mt-2 font-medium">{DRINK_CONFIG[drink].emoji} {DRINK_CONFIG[drink].name}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!isPreviewing && (
                  <div className="flex flex-wrap justify-center gap-6">
                    {selectedDrinks.map((drink, i) => (
                      <motion.div
                        key={drink}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                      >
                        <div className="relative w-24 h-28">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-white rounded-b-2xl border-4" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-24 h-4 bg-white border-4 border-t-0 rounded-t-xl" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute right-0 top-4 w-4 h-10 border-4 border-r-0 rounded-r-xl" style={{ borderColor: DRINK_CONFIG[drink].color }} />
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-b-xl" style={{ backgroundColor: DRINK_CONFIG[drink].color }} />
                        </div>
                        <p className="text-center text-xs text-slate-600 mt-2 font-medium">{DRINK_CONFIG[drink].emoji} {DRINK_CONFIG[drink].name}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedDrinks.length > 0 && (
            <button
              onClick={() => setSelectedDrinks([])}
              className="text-sm text-slate-500 hover:text-sky-500 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={selectedDrinks.length === 0 || isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {mode === 'edit' ? 'Update Coffee Date' : 'Save Coffee Date'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

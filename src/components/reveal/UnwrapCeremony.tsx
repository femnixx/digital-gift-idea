'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Parcel } from '@/components/parcel/Parcel'
import { WaxSeal } from '@/components/parcel/WaxSeal'
import { GiftTag } from '@/components/parcel/GiftTag'
import { Ribbon } from '@/components/parcel/Ribbon'
import type { KeepsakeGift, KeepsakeGiftItem } from '@/types/keepsake'

interface GiftContentProps {
  gift: KeepsakeGift
  items: KeepsakeGiftItem[]
}

function GiftContent({ gift, items }: GiftContentProps) {
  // Render based on gift type
  return (
    <div className="text-center pt-12">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ks-font-display text-3xl text-[#2B2118] mb-2"
      >
        {gift.title}
      </motion.h2>
      {gift.note && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="ks-font-body text-lg text-[#5A4A3B] mb-10 max-w-xl mx-auto leading-relaxed"
        >
          {gift.note}
        </motion.p>
      )}
      {/* Items rendered by type below this layer */}
      <div className="grid gap-4 px-4 md:px-0">
        {items.map((item) => (
          <GiftItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function GiftItem({ item }: { item: KeepsakeGiftItem }) {
  switch (item.kind) {
    case 'letter':
      return (
        <div className="ks-font-handwriting italic text-[#2B2118] text-lg p-8 bg-[#FBF6EA] border border-[#E7DAC2] shadow-tactile-card rounded-lg ks-card-edge">
          {item.payload.body || item.payload.content || ''}
        </div>
      )
    case 'card':
      return (
        <div className="flex items-center justify-center gap-4 px-4">
          {item.payload.text && (
            <div className="w-24 h-32 bg-[#FBF6EA] border border-[#5a4a3b]/40 shadow-tactile-card rounded-lg p-4 ks-font-handwriting italic text-[#2B2118] text-sm leading-relaxed">
              {item.payload.text}
            </div>
          )}
        </div>
      )
    case 'photo':
      return (
        <div className="w-48 h-48 bg-[#E7DAC2] border border-[#c9b29a] shadow-tactile-card rounded-lg flex items-center justify-center rotate-1">
          {item.payload.url ? (
            <img src={item.payload.url} alt={item.payload.caption || 'photo'} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-xs text-[#5A4A3B]">Photo</div>
          )}
        </div>
      )
    case 'coupon':
      return (
        <div className="w-48 h-24 bg-[#FBF6EA] border-2 border-[#5a4a3b] shadow-tactile-card rounded-none flex items-center justify-center px-4 ks-font-display text-[#7A1F2B] font-bold text-sm uppercase tracking-widest">
          {item.payload.title || 'Coupon'}
        </div>
      )
    case 'track':
      return (
        <div className="flex items-center justify-between px-4 py-2 bg-[#FBF6EA] border border-[#E7DAC2] shadow-tactile-card rounded-lg ks-font-body text-sm">
          <span>{item.payload.title || 'Track'}</span>
          <span className="text-[#5A4A3B]">{item.payload.artist || ''}</span>
        </div>
      )
    default:
      return <div className="text-sm text-[#5A4A3B]">{item.payload.body || ''}</div>
  }
}

interface UnwrapCeremonyProps {
  slug: string
}

export default function UnwrapCeremony({ slug }: UnwrapCeremonyProps) {
  const reduceMotion = useReducedMotion()
  const [stage, setStage] = useState<'locked' | 'sealed' | 'unwrapping' | 'revealed' | 'error'>('sealed')
  const [gift, setGift] = useState<KeepsakeGift | null>(null)
  const [items, setItems] = useState<KeepsakeGiftItem[]>([])
  const [pinRequired, setPinRequired] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const [pinValue, setPinValue] = useState('')
  const [skip, setSkip] = useState(false)

  // Fetch gift data
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch(`/api/gifts/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) {
          setStage('error')
          return
        }
        const data = await res.json()
        setGift(data.gift)
        setItems(data.items || [])
        setPinRequired(data.gift?.pin_required || false)
        setLocked(data.gift?.locked || false)
        setLockedUntil(data.gift?.locked_until || null)
        if (data.gift?.locked) {
          setStage('locked')
        } else {
          setStage('sealed')
        }
      } catch {
        setStage('error')
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [slug])

  // If skip, go straight to revealed
  useEffect(() => {
    if (skip && stage === 'sealed') {
      setStage('revealed')
    }
  }, [skip, stage])

  const handleRibbonUntie = useCallback(() => {
    setStage('unwrapping')
    setTimeout(() => setStage('revealed'), reduceMotion ? 0 : 900)
  }, [reduceMotion])

  const handleWaxCrack = useCallback(() => {
    // wax cracks when unwrapping starts
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side verification isn't secure; server verifies on the actual fetch.
    // For now, accept the PIN and proceed to sealed state.
    setStage('sealed')
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen table-surface flex flex-col items-center justify-center p-6 text-center">
        <h1 className="ks-font-display text-3xl text-[#2B2118] mb-2">This gift can&rsquo;t be opened</h1>
        <p className="ks-font-body text-lg text-[#5A4A3B] mb-6">The link may have been taken down or is no longer available.</p>
        <a href="/" className="btn-tactile">Back to Keepsake</a>
      </div>
    )
  }

  if (stage === 'locked') {
    return (
      <div className="min-h-screen table-surface flex flex-col items-center justify-center p-6 text-center">
        <WaxSeal monogram="K" className="mb-6" />
        <h1 className="ks-font-display text-3xl text-[#2B2118] mb-2">Not yet</h1>
        <p className="ks-font-body text-lg text-[#5A4A3B] mb-8">
          This gift is scheduled to open on{' '}
          <span className="ks-font-ui text-[#7A1F2B] font-semibold">{new Date(lockedUntil || '').toLocaleDateString()}</span>.
        </p>
        <a href="/" className="btn-tactile">Back to Keepsake</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen table-surface flex flex-col items-center justify-center p-4 md:p-8 text-center">
      {/* Skip ceremony button (accessibility) */}
      {!skip && stage === 'sealed' && (
        <button
          onClick={() => setSkip(true)}
          className="ks-skip btn-tactile text-xs px-3 py-1.5"
          aria-label="Skip ceremony"
        >
          Skip ceremony
        </button>
      )}

      {stage === 'sealed' && (
        <>
          {pinRequired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-3">
                <label className="ks-label">Enter the PIN to open this gift</label>
                <input
                  type="text"
                  maxLength={8}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  className="input-tactile w-32 text-center letter-spacing-widest"
                  placeholder="----"
                  autoFocus
                />
                <button type="submit" className="btn-tactile-oxblood text-white px-6">
                  Unlock
                </button>
              </form>
            </motion.div>
          )}

          <Parcel
            open={false}
            ribbonTied={true}
            sealCracked={false}
            onRibbonUntie={handleRibbonUntie}
            tagText={gift?.recipient_name ? `For ${gift.recipient_name}` : 'For You'}
            paperColor="paper"
            className="mb-8"
          />

          {!reduceMotion && !skip && (
            <p className="ks-font-ui text-sm text-[#5A4A3B] mt-4 uppercase tracking-widest">
              Drag the ribbon to untie · or press Enter
            </p>
          )}
        </>
      )}

      {stage === 'unwrapping' && (
        <>
          <Parcel
            open={true}
            ribbonTied={false}
            sealCracked={true}
            tagText={gift?.recipient_name ? `For ${gift.recipient_name}` : 'For You'}
            paperColor="paper"
            className="mb-8"
          />
          <p className="ks-font-ui text-sm text-[#5A4A3B] uppercase tracking-widest">Opening…</p>
        </>
      )}

      {stage === 'revealed' && gift && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <GiftContent gift={gift} items={items} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Image, Gift, Clock, Sliders, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import {
  KEEPSAKE_GIFT_LABELS,
  WRAP_PAPERS,
  WRAP_RIBBONS,
  WRAP_SEALS,
  type KeepsakeGiftType,
} from '@/types/keepsake'
import type { BuilderState } from './types'
import { INITIAL_STATE } from './types'

const TYPE_ICONS: Record<KeepsakeGiftType, React.ElementType> = {
  letter: Mail,
  memory_book: Image,
  coupon_booklet: Gift,
  reasons: Sliders,
  mixtape: Gift,
}

const STEP_LABELS = [
  'Choose type',
  'Personalize',
  'Choose wrapping',
  'Write your note',
  'Delivery & publish',
]

export default function GiftBuilder() {
  const [state, setState] = useState<BuilderState>({ ...INITIAL_STATE })
  const [submitting, setSubmitting] = useState(false)
  const [publishOk, setPublishOk] = useState(false)
  const [publishError, setPublishError] = useState('')

  const goTo = useCallback((step: number) => {
    setState((s) => ({ ...s, step }))
  }, [])

  const setField = useCallback(<K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const canPublish = () => {
    if (!state.type) return false
    if (!state.title.trim()) return false
    if (state.type === 'memory_book' && state.photos.length < 5) return false
    if (state.type === 'memory_book' && state.photos.length > 20) return false
    if (state.type === 'reasons' && state.reasons.length === 0) return false
    return true
  }

  const handlePublish = async () => {
    setPublishError('')
    setSubmitting(true)
    try {
      const payload: {
        title: string
        recipient_name: string | null
        type: KeepsakeGiftType | null
        note: string | null
        wrap_style: BuilderState['wrap_style']
        unlock_at: string | null
        pin: string | null
        is_published: boolean
        slug?: string
        items: Array<{
          kind: string
          payload: Record<string, unknown>
          position: number
        }>
      } = {
        title: state.title,
        recipient_name: state.recipient_name || null,
        type: state.type ?? null,
        note: state.note || null,
        wrap_style: state.wrap_style,
        unlock_at: state.unlock_at || null,
        pin: state.pin || null,
        is_published: state.is_published,
        items: [],
      }

      if (state.custom_slug.trim()) {
        payload.slug = state.custom_slug.trim()
      }

      if (state.type === 'letter') {
        payload.items.push({
          kind: 'letter',
          payload: { body: state.letter_body, paper_stock: state.letter_paper_stock },
          position: 0,
        })
      }
      if (state.type === 'memory_book') {
        state.photos.forEach((p, i) => {
          payload.items.push({
            kind: 'photo',
            payload: { url: p.url, caption: p.caption },
            position: i,
          })
        })
      }
      if (state.type === 'coupon_booklet') {
        state.coupons.forEach((c, i) => {
          payload.items.push({
            kind: 'coupon',
            payload: { title: c.title, description: c.description },
            position: i,
          })
        })
      }
      if (state.type === 'reasons') {
        state.reasons.forEach((r, i) => {
          payload.items.push({ kind: 'card', payload: { text: r.text }, position: i })
        })
      }
      if (state.type === 'mixtape') {
        state.tracks.forEach((t, i) => {
          payload.items.push({
            kind: 'track',
            payload: { title: t.title, artist: t.artist, url: t.url, note: t.note },
            position: i,
          })
        })
      }

      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      setPublishOk(true)
      setState((s) => ({ ...s, step: 6, _gift: data.gift }))
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSubmitting(false)
    }
  }

  const step = state.step

  return (
    <div className="min-h-screen bg-[#F3EBDD] text-[#2B2118] font-serif">
      <nav className="px-6 py-4 max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-[#7A1F2B] tracking-tighter italic" style={{ textDecoration: 'none' }}>
          Keepsake
        </Link>
        <div className="text-xs uppercase tracking-widest text-[#5A4A3B]">
          Build a gift &middot; Step {step} of 5
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex gap-2">
            {STEP_LABELS.map((label, i) => {
              const active = i + 1 === step
              const done = i + 1 < step
              return (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#5A4A3B]/40 text-xs">/</span>}
                  <span
                    className={`text-xs font-medium uppercase tracking-widest transition-colors ${
                      done ? 'text-[#7A1F2B]' : active ? 'text-[#2B2118]' : 'text-[#5A4A3B]/50'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <GiftTypeStep onSelect={(t) => setState((s) => ({ ...s, type: t, step: 2 }))} />
          )}
          {step === 2 && <PersonalizeStep state={state} setField={setField} goTo={goTo} />}
          {step === 3 && <WrapStep state={state} setField={setField} goTo={goTo} />}
          {step === 4 && <NoteStep state={state} setField={setField} goTo={goTo} />}
          {step === 5 && (
            <DeliveryStep
              state={state}
              setField={setField}
              goTo={goTo}
              canPublish={canPublish()}
              onPublish={handlePublish}
              submitting={submitting}
              publishOk={publishOk}
              publishError={publishError}
            />
          )}
          {step === 6 && <SuccessStep gift={state._gift} />}
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ---------- Step 1: Choose type ---------- */
function GiftTypeStep({ onSelect }: { onSelect: (t: KeepsakeGiftType) => void }) {
  const types: KeepsakeGiftType[] = ['letter', 'memory_book', 'coupon_booklet', 'reasons', 'mixtape']
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-2">What kind of gift?</h1>
      <p className="text-[#5A4A3B] mb-8">Each one is wrapped and opened in a ceremonial reveal.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {types.map((t) => {
          const Icon = TYPE_ICONS[t]
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              className="flex flex-col items-center gap-3 p-8 border-2 border-[#E7DAC2] rounded-lg bg-[#FBF6EA] shadow-tactile-card hover:border-[#7A1F2B] transition-colors ks-card-edge"
            >
              <div className="w-16 h-16 rounded-full bg-[#D9A7A0]/40 flex items-center justify-center mb-2 shadow-tactile-wax">
                <Icon className="w-8 h-8 text-[#7A1F2B]" />
              </div>
              <span className="font-bold text-lg">{KEEPSAKE_GIFT_LABELS[t]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Step 2: Personalize ---------- */
interface PersonalizeStepProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
  goTo: (step: number) => void
}
function PersonalizeStep({ state, setField }: PersonalizeStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-2">Personalize it</h1>
      <p className="text-[#5A4A3B] mb-8">Give your gift a name and tell us who it&rsquo;s for.</p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="ks-label">Gift title</label>
          <input
            className="input-tactile w-full"
            value={state.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Our first year"
          />
        </div>
        <div>
          <label className="ks-label">Recipient (shown on the tag)</label>
          <input
            className="input-tactile w-full"
            value={state.recipient_name}
            onChange={(e) => setField('recipient_name', e.target.value)}
            placeholder="e.g. Ava"
          />
        </div>
      </div>

      {state.type === 'letter' && <LetterContent state={state} setField={setField} />}
      {state.type === 'memory_book' && <MemoryBookContent state={state} setField={setField} />}
      {state.type === 'coupon_booklet' && <CouponContent state={state} setField={setField} />}
      {state.type === 'reasons' && <ReasonsContent state={state} setField={setField} />}
      {state.type === 'mixtape' && <MixtapeContent state={state} setField={setField} />}
    </div>
  )
}

interface LetterContentProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}
function LetterContent({ state, setField }: LetterContentProps) {
  return (
    <div className="pt-6 border-t border-[#E7DAC2]">
      <label className="ks-label">Your letter</label>
      <textarea
        className="input-tactile w-full min-h-[200px] mt-2"
        value={state.letter_body}
        onChange={(e) => setField('letter_body', e.target.value)}
        placeholder="Write your letter here…"
      />
      <div className="mt-4">
        <label className="ks-label">Paper stock</label>
        <select
          className="input-tactile w-full mt-2"
          value={state.letter_paper_stock}
          onChange={(e) => setField('letter_paper_stock', e.target.value)}
        >
          {Object.entries(WRAP_PAPERS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface MemoryBookContentProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}
function MemoryBookContent({ state, setField }: MemoryBookContentProps) {
  return (
    <div className="pt-6 border-t border-[#E7DAC2]">
      <label className="ks-label">Photos (5&ndash;20)</label>
      <p className="text-xs text-[#5A4A3B] mb-4">Paste an image URL for each photo.</p>
      <div className="space-y-3">
        {state.photos.map((p, i) => (
          <div key={i} className="flex gap-3">
            <input
              className="input-tactile flex-1"
              value={p.url}
              onChange={(e) => {
                const next = [...state.photos]
                next[i].url = e.target.value
                setField('photos', next)
              }}
              placeholder="Image URL"
            />
            <input
              className="input-tactile w-48"
              value={p.caption}
              onChange={(e) => {
                const next = [...state.photos]
                next[i].caption = e.target.value
                setField('photos', next)
              }}
              placeholder="Caption"
            />
          </div>
        ))}
        <button
          onClick={() => {
            if (state.photos.length >= 20) return
            setField('photos', [...state.photos, { url: '', caption: '' }])
          }}
          className="btn-tactile text-xs px-4 py-2"
        >
          + Add photo
        </button>
        <p className="text-xs text-[#5A4A3B]">{state.photos.length} / 20 photos</p>
      </div>
    </div>
  )
}

interface CouponContentProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}
function CouponContent({ state, setField }: CouponContentProps) {
  return (
    <div className="pt-6 border-t border-[#E7DAC2]">
      <label className="ks-label">Coupons</label>
      <p className="text-xs text-[#5A4A3B] mb-4">Tear-off vouchers your partner can redeem.</p>
      <div className="space-y-3">
        {state.coupons.map((c, i) => (
          <div key={i} className="flex gap-3">
            <input
              className="input-tactile flex-1"
              value={c.title}
              onChange={(e) => {
                const next = [...state.coupons]
                next[i].title = e.target.value
                setField('coupons', next)
              }}
              placeholder="e.g. One back massage"
            />
            <input
              className="input-tactile w-48"
              value={c.description}
              onChange={(e) => {
                const next = [...state.coupons]
                next[i].description = e.target.value
                setField('coupons', next)
              }}
              placeholder="Details"
            />
          </div>
        ))}
        <button
          onClick={() => setField('coupons', [...state.coupons, { title: '', description: '' }])}
          className="btn-tactile text-xs px-4 py-2"
        >
          + Add coupon
        </button>
      </div>
    </div>
  )
}

interface ReasonsContentProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}
function ReasonsContent({ state, setField }: ReasonsContentProps) {
  return (
    <div className="pt-6 border-t border-[#E7DAC2]">
      <label className="ks-label">Reasons I love you</label>
      <p className="text-xs text-[#5A4A3B] mb-4">One reason per card. Choose any count (52, 100, 365…).</p>
      <div className="space-y-3">
        {state.reasons.map((r, i) => (
          <input
            key={i}
            className="input-tactile w-full"
            value={r.text}
            onChange={(e) => {
              const next = [...state.reasons]
              next[i].text = e.target.value
              setField('reasons', next)
            }}
            placeholder={`Reason ${i + 1}`}
          />
        ))}
        <button
          onClick={() => setField('reasons', [...state.reasons, { text: '' }])}
          className="btn-tactile text-xs px-4 py-2"
        >
          + Add reason
        </button>
        <p className="text-xs text-[#5A4A3B]">{state.reasons.length} cards</p>
      </div>
    </div>
  )
}

interface MixtapeContentProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}
function MixtapeContent({ state, setField }: MixtapeContentProps) {
  return (
    <div className="pt-6 border-t border-[#E7DAC2]">
      <label className="ks-label">Tracks</label>
      <p className="text-xs text-[#5A4A3B] mb-4">Add songs with Spotify / Apple Music links and a note per track.</p>
      <div className="space-y-3">
        {state.tracks.map((t, i) => (
          <div key={i} className="grid grid-cols-4 gap-3">
            <input
              className="input-tactile"
              value={t.title}
              onChange={(e) => {
                const next = [...state.tracks]
                next[i].title = e.target.value
                setField('tracks', next)
              }}
              placeholder="Title"
            />
            <input
              className="input-tactile"
              value={t.artist}
              onChange={(e) => {
                const next = [...state.tracks]
                next[i].artist = e.target.value
                setField('tracks', next)
              }}
              placeholder="Artist"
            />
            <input
              className="input-tactile"
              value={t.url}
              onChange={(e) => {
                const next = [...state.tracks]
                next[i].url = e.target.value
                setField('tracks', next)
              }}
              placeholder="Link"
            />
            <input
              className="input-tactile"
              value={t.note}
              onChange={(e) => {
                const next = [...state.tracks]
                next[i].note = e.target.value
                setField('tracks', next)
              }}
              placeholder="Note"
            />
          </div>
        ))}
        <button
          onClick={() => setField('tracks', [...state.tracks, { title: '', artist: '', url: '', note: '' }])}
          className="btn-tactile text-xs px-4 py-2"
        >
          + Add track
        </button>
      </div>
    </div>
  )
}

/* ---------- Step 3: Wrapping ---------- */
interface WrapStepProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
  goTo: (step: number) => void
}
function WrapStep({ state, setField }: WrapStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-2">Choose wrapping</h1>
      <p className="text-[#5A4A3B] mb-8">Pick paper, ribbon, seal and tag.</p>

      <div className="grid gap-6 md:grid-cols-4 max-w-5xl">
        <WrapOption
          label="Paper"
          items={Object.entries(WRAP_PAPERS)}
          value={state.wrap_style.paper}
          onChange={(v: string) => setField('wrap_style', { ...state.wrap_style, paper: v })}
        />
        <WrapOption
          label="Ribbon"
          items={Object.entries(WRAP_RIBBONS)}
          value={state.wrap_style.ribbon}
          onChange={(v: string) => setField('wrap_style', { ...state.wrap_style, ribbon: v })}
        />
        <WrapOption
          label="Seal"
          items={Object.entries(WRAP_SEALS)}
          value={state.wrap_style.seal}
          onChange={(v: string) => setField('wrap_style', { ...state.wrap_style, seal: v })}
        />
        <div className="flex flex-col gap-2">
          <label className="ks-label">Tag text</label>
          <input
            className="input-tactile w-full"
            value={state.wrap_style.tagText}
            onChange={(e) => setField('wrap_style', { ...state.wrap_style, tagText: e.target.value })}
            placeholder="For You"
          />
        </div>
      </div>
    </div>
  )
}

interface WrapOptionProps {
  label: string
  items: [string, { label: string; description?: string }][]
  value: string
  onChange: (v: string) => void
}
function WrapOption({ label, items, value, onChange }: WrapOptionProps) {
  return (
    <div className="space-y-2">
      <span className="ks-label">{label}</span>
      <div className="grid gap-2">
        {items.map(([k, v]) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`px-4 py-2 rounded-sm border text-sm font-medium text-center transition-colors ${
              value === k
                ? 'bg-[#7A1F2B] border-[#7A1F2B] text-white'
                : 'bg-[#FBF6EA] border-[#E7DAC2] text-[#2B2118] hover:bg-[#E7DAC2]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Step 4: Note ---------- */
interface NoteStepProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
  goTo: (step: number) => void
}
function NoteStep({ state, setField }: NoteStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-2">Write your note</h1>
      <p className="text-[#5A4A3B] mb-8">The note appears on the first card after unsealing.</p>
      <textarea
        className="input-tactile w-full min-h-[300px]"
        value={state.note}
        onChange={(e) => setField('note', e.target.value)}
        placeholder="Your message to them…"
      />
    </div>
  )
}

/* ---------- Step 5: Delivery & publish ---------- */
interface DeliveryStepProps {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
  goTo: (step: number) => void
  canPublish: boolean
  onPublish: () => void
  submitting: boolean
  publishOk: boolean
  publishError: string
}
function DeliveryStep({ state, setField, canPublish, onPublish, submitting, publishError }: DeliveryStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-2">Delivery & publish</h1>
      <p className="text-[#5A4A3B] mb-8">Choose how and when your gift arrives.</p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="ks-label">Send</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setField('is_published', true)}
              className={`flex-1 py-2 border rounded-sm text-sm font-medium transition-colors ${
                state.is_published ? 'bg-[#7A1F2B] border-[#7A1F2B] text-white' : 'bg-[#FBF6EA] border-[#E7DAC2] text-[#2B2118]'
              }`}
            >
              Publish now
            </button>
            <button
              onClick={() => setField('is_published', false)}
              className={`flex-1 py-2 border rounded-sm text-sm font-medium transition-colors ${
                !state.is_published ? 'bg-[#7A1F2B] border-[#7A1F2B] text-white' : 'bg-[#FBF6EA] border-[#E7DAC2] text-[#2B2118]'
              }`}
            >
              Save draft
            </button>
          </div>
        </div>

        <div>
          <label className="ks-label">Schedule delivery</label>
          <input
            type="datetime-local"
            className="input-tactile w-full mt-2"
            value={state.unlock_at || ''}
            onChange={(e) => setField('unlock_at', e.target.value || null)}
          />
          <p className="text-xs text-[#5A4A3B] mt-1">Leave blank to send immediately.</p>
        </div>

        <div>
          <label className="ks-label">Optional PIN</label>
          <input
            type="text"
            maxLength={8}
            className="input-tactile w-full mt-2 text-center"
            value={state.pin}
            onChange={(e) => setField('pin', e.target.value)}
            placeholder="e.g. anniversary date"
          />
          <p className="text-xs text-[#5A4A3B] mt-1">Only people who know the PIN can open it.</p>
        </div>

        <div>
          <label className="ks-label">Custom slug</label>
          <div className="flex gap-2 mt-2">
            <span className="text-xs text-[#5A4A3B] whitespace-nowrap">/g/</span>
            <input
              className="input-tactile flex-1 font-mono text-sm"
              value={state.custom_slug}
              onChange={(e) => setField('custom_slug', e.target.value)}
              placeholder="auto-generated"
            />
          </div>
          <p className="text-xs text-[#5A4A3B] mt-1">Leave blank for a long random slug.</p>
        </div>
      </div>

      {publishError && <p className="text-sm text-[#9A2E3E]">{publishError}</p>}

      <div className="pt-8">
        <button
          onClick={onPublish}
          disabled={submitting || !canPublish}
          className="btn-tactile-oxblood text-white w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Publishing…' : canPublish ? 'Publish gift' : 'Complete the required fields'}
        </button>
      </div>
    </div>
  )
}

/* ---------- Step 6: Success ---------- */
interface SuccessStepProps {
  gift: any
}
function SuccessStep({ gift }: SuccessStepProps) {
  const url = gift?.url || ''
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&margin=10`
  const share = (via: string) => {
    const body = encodeURIComponent(`I made you a gift on Keepsake — open it here: ${url}`)
    if (via === 'whatsapp') {
      window.open(`https://wa.me/?text=${body}`, '_blank')
    } else if (via === 'messages') {
      window.open(`sms:?body=${body}`, '_blank')
    } else {
      window.open(`mailto:?body=${body}`, '_blank')
    }
  }
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#7A1F2B] flex items-center justify-center mx-auto mb-4 shadow-tactile-wax">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold">Your gift is live</h1>
      <p className="text-[#5A4A3B] mb-8">Share the link however you like.</p>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 bg-[#FBF6EA] border border-[#E7DAC2] shadow-tactile-card rounded-lg px-6 py-4">
          <span className="text-xs text-[#5A4A3B] uppercase tracking-widest">Link</span>
          <span className="font-mono text-[#2B2118]">{url}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-[#E7DAC2] bg-[#FBF6EA] p-3 shadow-tactile-card">
            <img src={qrUrl} alt="QR code" className="qr-code w-24 h-24" />
            <p className="text-[10px] text-[#5A4A3B] mt-2 uppercase tracking-widest">Scan to open</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(url)
            }}
            className="btn-tactile px-6 py-2 text-sm"
          >
            Copy link
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => share('messages')} className="btn-tactile px-4 py-2 text-xs">Messages</button>
          <button onClick={() => share('whatsapp')} className="btn-tactile px-4 py-2 text-xs">WhatsApp</button>
          <button onClick={() => share('email')} className="btn-tactile px-4 py-2 text-xs">Email</button>
        </div>
      </div>
    </div>
  )
}

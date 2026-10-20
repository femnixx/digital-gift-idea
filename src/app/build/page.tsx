'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createGift, publishGift, checkSlugAvailability } from '@/app/actions/gifts'
import { StampPicker } from '@/components/fields/StampPicker'
import { PaperPicker } from '@/components/fields/PaperPicker'
import { LinedTextarea } from '@/components/fields/LinedTextarea'
import { SlugField } from '@/components/fields/SlugField'
import { PinCells } from '@/components/fields/PinCells'
import { SkyDial } from '@/components/fields/SkyDial'

const WRAP_STYLES = [
  { value: 'airmail', label: 'Airmail', description: 'Diagonal blue-white stripes' },
  { value: 'plain', label: 'Plain', description: 'Clean white paper' },
  { value: 'grid', label: 'Grid', description: 'Quarter-inch graph' },
]

const PAPER_STOCKS = [
  { value: 'parchment', label: 'Parchment', description: 'Aged, warm vellum look' },
  { value: 'ruled', label: 'Ruled', description: 'Notebook-style lines' },
  { value: 'vellum', label: 'Vellum', description: 'Smooth cream writing paper' },
]

const GIFT_TYPES = [
  { id: 'letter', label: 'Love Letter', desc: 'Handwritten note with paper choice', emoji: '💌' },
  { id: 'reasons', label: 'Reasons I Love You', desc: 'A flip deck of reasons', emoji: '❤️' },
  { id: 'memory_book', label: 'Memory Book', desc: 'Photos on a route line', emoji: '📖' },
  { id: 'coupons', label: 'Coupon Booklet', desc: 'Redeemable vouchers', emoji: '🎫' },
  { id: 'mixtape', label: 'Playlist Mixtape', desc: 'Songs with notes', emoji: '🎵' },
  { id: 'open_when', label: 'Open-When Letters', desc: 'Open when you miss me', emoji: '⏰' },
  { id: 'countdown', label: 'Countdown Series', desc: 'A mini-gift every day', emoji: '📅' },
  { id: 'quiz', label: 'Quiz', desc: 'How well do you know me?', emoji: '❓' },
  { id: 'hunt', label: 'Scavenger Hunt', desc: 'Clue chain with answers', emoji: '🔍' },
  { id: 'date_jar', label: 'Date Jar', desc: 'Draw date ideas', emoji: '🍷' },
] as const

type GiftTypeId = (typeof GIFT_TYPES)[number]['id']

const STEPS = ['Gift type', 'Personalize', 'Choose wrapping', 'Write your note', 'Delivery & publish'] as const

interface Photo {
  url: string
  caption: string
}
interface Coupon {
  title: string
  description: string
}
interface Track {
  title: string
  artist: string
  url: string
  note: string
}

interface BuilderState {
  giftType: GiftTypeId | null
  title: string
  recipientName: string
  letterBody: string
  paperStock: string
  wrapStyle: string
  note: string
  reasons: string[]
  photos: Photo[]
  coupons: Coupon[]
  tracks: Track[]
}

const INITIAL_STATE: BuilderState = {
  giftType: null,
  title: '',
  recipientName: '',
  letterBody: '',
  paperStock: 'parchment',
  wrapStyle: 'airmail',
  note: '',
  reasons: [''],
  photos: [],
  coupons: [],
  tracks: [],
}

export default function BuildPage() {
  return <BuilderShell />
}

function BuilderShell() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [state, setState] = useState<BuilderState>(INITIAL_STATE)

  const step = Math.min(Math.max(Number(sp.get('step') ?? '0') || 0, 0), STEPS.length - 1)

  const go = useCallback(
    (n: number) => {
      const next = new URLSearchParams(sp.toString())
      next.set('step', String(n))
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [pathname, router, sp]
  )

  const setField = useCallback(<K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const canContinue = useMemo(() => {
    if (step === 0) return state.giftType !== null
    if (step === 1) return state.title.trim().length > 0
    return true
  }, [step, state])

  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <main className="max-w-5xl mx-auto px-5 py-8">
        <ol role="navigation" aria-label="Builder progress" className="flex gap-2 mb-8 flex-wrap">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
                className={`px-4 py-2 border rounded-[4px] text-sm font-medium transition-colors ${
                  i === step
                    ? 'bg-accent border-accent text-white shadow-btn'
                    : i < step
                      ? 'bg-accent-soft border-accent text-accent-text'
                      : 'bg-surface border-line text-text-muted'
                }`}
              >
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && <StepGiftType state={state} setField={setField} go={go} />}
        {step === 1 && <StepPersonalize state={state} setField={setField} />}
        {step === 2 && <StepWrap state={state} setField={setField} />}
        {step === 3 && <StepNote state={state} setField={setField} />}
        {step === 4 && <StepDelivery state={state} />}

        {step < STEPS.length - 1 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => go(step - 1)}
              className="btn-ghost px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => go(step + 1)}
              className="btn px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function StepGiftType({
  state,
  setField,
  go,
}: {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
  go: (n: number) => void
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">What kind of gift?</h1>
      <p className="text-text-soft">Each one is sent across the sky and opened in a ceremonial reveal.</p>
      <div className="grid gap-4 md:grid-cols-5">
        {GIFT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setField('giftType', t.id)
              go(1)
            }}
            className={`card p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-accent transition-colors ${
              state.giftType === t.id ? 'border-accent bg-accent-soft' : 'border-line'
            }`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <span className="font-ui font-medium text-center">{t.label}</span>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepPersonalize({
  state,
  setField,
}: {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Personalize it</h1>
      <p className="text-text-soft">Give your gift a name and tell us who it&rsquo;s for.</p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label htmlFor="gift-title" className="block font-ui text-sm font-medium text-text mb-1">
            Gift title
          </label>
          <input
            id="gift-title"
            className="w-full border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
            value={state.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Our first year"
          />
        </div>
        <div>
          <label htmlFor="gift-recipient" className="block font-ui text-sm font-medium text-text mb-1">
            Recipient (shown on the tag)
          </label>
          <input
            id="gift-recipient"
            className="w-full border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
            value={state.recipientName}
            onChange={(e) => setField('recipientName', e.target.value)}
            placeholder="e.g. Ava"
          />
        </div>
      </div>

      {state.giftType === 'letter' && (
        <div className="pt-6 border-t border-line">
          <label htmlFor="gift-letter" className="block font-ui text-sm font-medium text-text mb-1">
            Your letter
          </label>
          <LinedTextarea
            value={state.letterBody}
            onChange={(v) => setField('letterBody', v)}
            maxLength={2000}
            helper="Write your letter here. It will be set in handwriting inside the envelope."
          />
          <PaperPicker
            options={PAPER_STOCKS}
            value={state.paperStock}
            onChange={(v) => setField('paperStock', v)}
            label="Paper stock"
          />
        </div>
      )}

      {state.giftType === 'reasons' && (
        <div className="pt-6 border-t border-line">
          <label className="block font-ui text-sm font-medium text-text mb-1">Reasons I love you</label>
          <p className="text-text-muted text-xs mb-3">One reason per card. Choose any count.</p>
          <div className="space-y-2">
            {state.reasons.map((r, i) => (
              <input
                key={i}
                aria-label={`Reason ${i + 1}`}
                className="w-full border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                value={r}
                onChange={(e) => {
                  const next = [...state.reasons]
                  next[i] = e.target.value
                  setField('reasons', next)
                }}
                placeholder={`Reason ${i + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setField('reasons', [...state.reasons, ''])}
              className="btn-ghost text-xs px-4 py-2"
            >
              + Add reason
            </button>
          </div>
        </div>
      )}

      {state.giftType === 'memory_book' && (
        <div className="pt-6 border-t border-line">
          <label className="block font-ui text-sm font-medium text-text mb-1">Photos (5&ndash;20)</label>
          <p className="text-text-muted text-xs mb-3">Paste an image URL for each photo.</p>
          <div className="space-y-2">
            {state.photos.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Photo ${i + 1} image URL`}
                  className="flex-1 border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={p.url}
                  onChange={(e) => {
                    const next = [...state.photos]
                    next[i] = { ...next[i], url: e.target.value }
                    setField('photos', next)
                  }}
                  placeholder="Image URL"
                />
                <input
                  aria-label={`Photo ${i + 1} caption`}
                  className="w-48 border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={p.caption}
                  onChange={(e) => {
                    const next = [...state.photos]
                    next[i] = { ...next[i], caption: e.target.value }
                    setField('photos', next)
                  }}
                  placeholder="Caption"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setField('photos', [...state.photos, { url: '', caption: '' }])}
              className="btn-ghost text-xs px-4 py-2"
            >
              + Add photo
            </button>
          </div>
        </div>
      )}

      {state.giftType === 'coupons' && (
        <div className="pt-6 border-t border-line">
          <label className="block font-ui text-sm font-medium text-text mb-1">Coupons</label>
          <p className="text-text-muted text-xs mb-3">Redeemable vouchers your partner can redeem.</p>
          <div className="space-y-2">
            {state.coupons.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Coupon ${i + 1} title`}
                  className="flex-1 border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={c.title}
                  onChange={(e) => {
                    const next = [...state.coupons]
                    next[i] = { ...next[i], title: e.target.value }
                    setField('coupons', next)
                  }}
                  placeholder="e.g. One back massage"
                />
                <input
                  aria-label={`Coupon ${i + 1} details`}
                  className="w-48 border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={c.description}
                  onChange={(e) => {
                    const next = [...state.coupons]
                    next[i] = { ...next[i], description: e.target.value }
                    setField('coupons', next)
                  }}
                  placeholder="Details"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setField('coupons', [...state.coupons, { title: '', description: '' }])}
              className="btn-ghost text-xs px-4 py-2"
            >
              + Add coupon
            </button>
          </div>
        </div>
      )}

      {state.giftType === 'mixtape' && (
        <div className="pt-6 border-t border-line">
          <label className="block font-ui text-sm font-medium text-text mb-1">Tracks</label>
          <p className="text-text-muted text-xs mb-3">Add songs with links and a note per track.</p>
          <div className="space-y-2">
            {state.tracks.map((t, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <input
                  aria-label={`Track ${i + 1} title`}
                  className="border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={t.title}
                  onChange={(e) => {
                    const next = [...state.tracks]
                    next[i] = { ...next[i], title: e.target.value }
                    setField('tracks', next)
                  }}
                  placeholder="Title"
                />
                <input
                  aria-label={`Track ${i + 1} artist`}
                  className="border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={t.artist}
                  onChange={(e) => {
                    const next = [...state.tracks]
                    next[i] = { ...next[i], artist: e.target.value }
                    setField('tracks', next)
                  }}
                  placeholder="Artist"
                />
                <input
                  aria-label={`Track ${i + 1} link`}
                  className="border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={t.url}
                  onChange={(e) => {
                    const next = [...state.tracks]
                    next[i] = { ...next[i], url: e.target.value }
                    setField('tracks', next)
                  }}
                  placeholder="Link"
                />
                <input
                  aria-label={`Track ${i + 1} note`}
                  className="border border-line rounded-[4px] bg-surface px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                  value={t.note}
                  onChange={(e) => {
                    const next = [...state.tracks]
                    next[i] = { ...next[i], note: e.target.value }
                    setField('tracks', next)
                  }}
                  placeholder="Note"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setField('tracks', [...state.tracks, { title: '', artist: '', url: '', note: '' }])
              }
              className="btn-ghost text-xs px-4 py-2"
            >
              + Add track
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepWrap({
  state,
  setField,
}: {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Choose wrapping</h1>
      <p className="text-text-soft">Pick paper, ribbon, seal and tag.</p>

      <div className="grid gap-6 max-w-3xl">
        <StampPicker
          options={WRAP_STYLES}
          value={state.wrapStyle}
          onChange={(v) => setField('wrapStyle', v)}
          label="Wrap style"
        />
        <PaperPicker
          options={PAPER_STOCKS}
          value={state.paperStock}
          onChange={(v) => setField('paperStock', v)}
          label="Paper stock"
        />
      </div>
    </div>
  )
}

function StepNote({
  state,
  setField,
}: {
  state: BuilderState
  setField: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Write your note</h1>
      <p className="text-text-soft">The note appears on the first card after unsealing.</p>
      <LinedTextarea
        value={state.note}
        onChange={(v) => setField('note', v)}
        maxLength={1000}
        helper="Your message to them…"
      />
    </div>
  )
}

const PUBLISH_ERRORS: Record<string, string> = {
  reserved_slug: 'That slug is reserved. Pick another one.',
  slug_taken: 'That slug is already taken. Pick another one.',
  pin_hash_failed: 'We could not secure the PIN. Try again without a PIN.',
  db_error: 'Something went wrong while saving your gift. Please try again.',
  not_found: 'That gift no longer exists.',
}

function StepDelivery({ state }: { state: BuilderState }) {
  const [isPublished, setIsPublished] = useState(true)
  const [customSlug, setCustomSlug] = useState('')
  const [pin, setPin] = useState('')
  const [unlockAt, setUnlockAt] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'available' | 'taken' | 'reserved'>('idle')
  const [publishOk, setPublishOk] = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')
  const [publishError, setPublishError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSlugChange = async (slug: string) => {
    setCustomSlug(slug)
    if (!slug.trim()) {
      setSlugStatus('idle')
      return
    }
    const result = await checkSlugAvailability(slug)
    setSlugStatus(result.status)
  }

  const items = useMemo(() => {
    const list: Array<{ kind: string; payload: Record<string, unknown>; position: number }> = []
    if (state.giftType === 'letter') {
      list.push({
        kind: 'letter',
        payload: { body: state.letterBody, paper_stock: state.paperStock },
        position: 0,
      })
    }
    if (state.giftType === 'reasons') {
      state.reasons
        .filter((r) => r.trim())
        .forEach((r, i) => list.push({ kind: 'card', payload: { text: r }, position: i }))
    }
    if (state.giftType === 'memory_book') {
      state.photos.forEach((p, i) => list.push({ kind: 'photo', payload: { url: p.url, caption: p.caption }, position: i }))
    }
    if (state.giftType === 'coupons') {
      state.coupons.forEach((c, i) =>
        list.push({ kind: 'coupon', payload: { title: c.title, description: c.description }, position: i })
      )
    }
    if (state.giftType === 'mixtape') {
      state.tracks.forEach((t, i) =>
        list.push({
          kind: 'track',
          payload: { title: t.title, artist: t.artist, url: t.url, note: t.note },
          position: i,
        })
      )
    }
    return list
  }, [state])

  const handlePublish = async () => {
    setPublishError('')
    setSubmitting(true)
    try {
      const result = await createGift({
        type: state.giftType || 'letter',
        title: state.title.trim() || 'Untitled Gift',
        recipient_name: state.recipientName.trim() || null,
        note: state.note.trim() || null,
        wrap_style: state.wrapStyle,
        items,
        custom_slug: customSlug.trim() || undefined,
        pin: pin || undefined,
        unlock_at: unlockAt || undefined,
      })

      if (!result.ok) {
        setPublishError(PUBLISH_ERRORS[result.error] || PUBLISH_ERRORS.db_error)
        setSubmitting(false)
        return
      }

      const publishResult = await publishGift(result.gift.id, customSlug.trim() || undefined)
      if (!publishResult.ok) {
        setPublishError(
          PUBLISH_ERRORS[publishResult.error as string] || PUBLISH_ERRORS.db_error
        )
        setSubmitting(false)
        return
      }

      setPublishedSlug(publishResult.slug)
      setPublishOk(true)
    } catch (err: any) {
      setPublishError(err?.message || PUBLISH_ERRORS.db_error)
    } finally {
      setSubmitting(false)
    }
  }

  if (publishOk) {
    const href = `/g/${publishedSlug}`
    return (
      <div className="text-center space-y-6 py-12">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto shadow-btn">
          <span className="text-white text-2xl">🎉</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Your gift is live</h1>
        <p className="text-text-soft mb-8">Share the link however you like.</p>
        <div className="flex items-center justify-center gap-3 bg-surface border border-line shadow-btn rounded-lg px-6 py-4">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Link</span>
          <a
            id="published-link"
            href={href}
            data-testid="published-link"
            className="font-mono text-text underline underline-offset-4 hover:text-accent-text"
          >
            keepsake.love{href}
          </a>
        </div>
        <button type="button" onClick={() => setPublishOk(false)} className="btn-ghost">
          Build another
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Delivery &amp; publish</h1>
      <p className="text-text-soft">Choose how and when your gift arrives.</p>

      <div className="grid gap-6 max-w-xl">
        <div>
          <span className="block font-ui text-sm font-medium text-text mb-1">Send</span>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsPublished(true)}
              className={`flex-1 py-2 border rounded-sm text-sm font-medium transition-colors ${
                isPublished ? 'bg-accent border-accent text-white' : 'bg-surface border-line text-text'
              }`}
            >
              Publish now
            </button>
            <button
              type="button"
              onClick={() => setIsPublished(false)}
              className={`flex-1 py-2 border rounded-sm text-sm font-medium transition-colors ${
                !isPublished ? 'bg-accent border-accent text-white' : 'bg-surface border-line text-text'
              }`}
            >
              Save draft
            </button>
          </div>
        </div>

        <SkyDial
          value={unlockAt}
          onChange={setUnlockAt}
          label="Schedule delivery"
          helper="Leave blank to send immediately."
        />

        <PinCells
          length={4}
          value={pin}
          onChange={setPin}
          label="Optional PIN (4 digits)"
          helper="Only people who know the PIN can open it."
        />

        <SlugField
          value={customSlug}
          onChange={handleSlugChange}
          label="Custom slug"
          helper="Leave blank for a long random slug."
        />
        {slugStatus !== 'idle' && slugStatus !== 'available' && (
          <p className="font-mono text-xs text-danger">
            {slugStatus === 'taken' ? 'This slug is taken' : 'This slug is reserved'}
          </p>
        )}
      </div>

      {publishError && (
        <p role="alert" className="text-sm text-danger">
          {publishError}
        </p>
      )}

      <div className="pt-8">
        <button
          type="button"
          onClick={handlePublish}
          disabled={submitting}
          className="btn text-white w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Publishing…' : 'Publish gift'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { recordReveal, addReaction, addReply, verifyPIN, recordPinAttempt, getPinAttempts } from '@/app/actions/gifts'

interface ClientRevealProps {
  gift: any
}

export function ClientReveal({ gift }: ClientRevealProps) {
  const [step, setStep] = useState('sealed' as 'sealed' | 'opened' | 'replied')
  const [visitorId, setVisitorId] = useState<string>(() =>
    crypto.randomUUID()
  )
  const [reactions, setReactions] = useState<Record<string, string>>({})

  useEffect(() => {
    recordReveal(gift.id, visitorId)
  }, [gift.id, visitorId])

  const handleOpen = () => {
    setStep('opened')
  }

  const handleReact = (itemId: string, stamp: string) => {
    setReactions((prev) => ({ ...prev, [itemId]: stamp }))
    addReaction(itemId, visitorId, stamp)
  }

  const handleReply = () => {
    setStep('replied')
  }

  const stamps = ['❤️', '😍', '🥰', '😘', '💕', '💖', '✨', '🌟']

  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <header className="mx-auto w-full max-w-5xl px-5 pt-4 pb-6 flex items-center justify-between">
        <a href="/" className="font-display italic text-3xl text-accent-text" style={{ textDecoration: 'none' }}>
          Keepsake
        </a>
        <div className="font-ui text-xs uppercase tracking-[0.18em] text-text-muted">
          For {gift.recipient_name || 'you'}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {step === 'sealed' && (
          <div className="card min-h-[400px] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-airmail opacity-10" />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto mb-6 shadow-btn">
                <span className="text-4xl">📨</span>
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">A gift for you</h1>
              <p className="text-text-soft mb-8">{gift.title}</p>
              <button
                onClick={handleOpen}
                className="btn w-auto"
              >
                Open gift
              </button>
            </div>
          </div>
        )}

        {step === 'opened' && (
          <div className="space-y-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">{gift.title}</h1>
            {gift.note && (
              <div className="bg-surface-2 border border-line rounded-[4px] p-6 italic">
                {gift.note}
              </div>
            )}
            <div className="grid gap-4">
              {gift.items?.map((item: any, i: number) => (
                <div
                  key={item.id}
                  className="card p-4 flex items-start gap-3 hover:border-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-[4px] bg-accent-soft flex-shrink-0 flex items-center justify-center text-accent-text font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-ui font-medium text-text">{item.payload?.text || item.payload?.body || item.payload?.title || 'Item'}</div>
                    <div className="font-mono text-[10px] text-text-muted mt-1">{item.kind}</div>
                  </div>
                  <div className="flex gap-1">
                    {stamps.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleReact(item.id, s)}
                        className={`w-6 h-6 rounded-[4px] flex items-center justify-center text-xs ${reactions[item.id] === s ? 'ring-2 ring-accent' : 'bg-surface border border-line'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-line">
              <h2 className="font-ui font-semibold text-text mb-3">Send a reply</h2>
              <textarea
                className="w-full border border-line rounded-[4px] bg-surface px-4 py-3 text-text focus:outline-none focus:border-accent"
                rows={3}
                placeholder="Your reply…"
              />
              <button
                onClick={handleReply}
                className="btn mt-3 w-auto"
              >
                Send reply
              </button>
            </div>
          </div>
        )}

        {step === 'replied' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4 shadow-btn">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h1 className="font-display text-3xl font-bold">Reply sent</h1>
            <p className="text-text-soft mt-2">The giver will see your reply.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export function ClientPinEntry({ giftId }: { giftId: string }) {  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPinAttempts(giftId, crypto.randomUUID()).then(setAttempts)
  }, [giftId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await verifyPIN(giftId, pin)
      if (result.ok) {
        // PIN correct - redirect to same page (it will now be unlocked)
        window.location.reload()
      } else {
        await recordPinAttempt(giftId, crypto.randomUUID())
        setError('Incorrect PIN')
        setPin('')
      }
    } catch {
      setError('PIN verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-6">
      <PinCells
        length={4}
        value={pin}
        onChange={setPin}
        label="Enter PIN"
        error={error}
      />
      {attempts >= 5 && (
        <p className="font-mono text-xs text-danger">
          Too many attempts. Try again later.
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || pin.length < 4}
        className="btn w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Verifying…' : 'Unlock'}
      </button>
    </form>
  )
}

function PinCells({
  length,
  value,
  onChange,
  label,
  error,
}: {
  length: number
  value: string
  onChange: (v: string) => void
  label?: string
  error?: string
}) {
  const cells = value.split('').map((v) => ({ value: v, error: !!error }))
  while (cells.length < length) cells.push({ value: '', error: !!error })

  return (
    <div className="space-y-2">
      {label && <label className="font-ui text-sm font-medium text-text">{label}</label>}
      <div className="flex gap-2 justify-center">
        {cells.map((cell, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={cell.value}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 1)
              const next = value.slice(0, i) + v + value.slice(i + 1)
              onChange(next)
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-10 h-12 border border-line rounded-[4px] text-center font-mono text-lg font-medium text-text bg-surface focus:outline-none focus:border-accent transition-colors ${cell.error ? 'border-danger text-danger' : ''}"
          />
        ))}
      </div>
      {error && <p className="font-mono text-xs text-danger">{error}</p>}
    </div>
  )
}

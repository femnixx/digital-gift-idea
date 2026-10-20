'use client'

import { useState } from 'react'

interface ReplyFormProps {
  gift: any
  token: string
}

export function ReplyForm({ gift, token }: ReplyFormProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      const message = form.get('message') as string
      if (!message.trim()) {
        setError('Please write something.')
        setSending(false)
        return
      }
      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gift_id: gift.id, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4 shadow-btn">
          <span className="text-white text-2xl">✓</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Reply sent</h1>
        <p className="text-text-soft mt-2">The giver will see your reply.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface border border-line rounded-[4px] p-6">
        <p className="font-ui text-sm text-text-soft mb-4">Replying to "{gift.title}"</p>
        <textarea
          name="message"
          className="w-full border border-line rounded-[4px] bg-surface px-4 py-3 text-text focus:outline-none focus:border-accent"
          rows={5}
          placeholder="Your reply…"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending…' : 'Send reply'}
      </button>
    </form>
  )
}

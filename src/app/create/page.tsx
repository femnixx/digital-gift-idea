'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Flower2, Camera, ScanFace, Clock, Coffee, AudioLines, Check, ArrowRight, ArrowLeft
} from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import type { EntryType } from '@/types'

interface Option {
  type: EntryType
  label: string
  blurb: string
  icon: typeof Mail
  accent: string
}

const OPTIONS: Option[] = [
  { type: 'letter', label: 'Love Letter', blurb: 'A heartfelt note with beautiful typography', icon: Mail, accent: 'sky' },
  { type: 'bouquet', label: 'Digital Bouquet', blurb: 'Flowers that never wilt, arranged by you', icon: Flower2, accent: 'green' },
  { type: 'polaroid', label: 'Polaroid Deck', blurb: 'Photo memories with tilt and hidden notes', icon: Camera, accent: 'amber' },
  { type: 'scratch_card', label: 'Scratch Card', blurb: 'A surprise hidden under a scratch-off cover', icon: ScanFace, accent: 'purple' },
  { type: 'open_when', label: 'Open When', blurb: 'Sealed envelopes that open on a trigger', icon: Clock, accent: 'rose' },
  { type: 'coffee_date', label: 'Coffee Date', blurb: 'A shared drink, across any timezone', icon: Coffee, accent: 'blue' },
  { type: 'voice_note', label: 'Voice Note', blurb: 'Your voice, on a cassette', icon: AudioLines, accent: 'pink' },
]

const ACCENT_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-500' },
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

export default function CreatePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Option | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const slugPreview = useMemo(() => slug || slugify(title), [slug, title])

  function choose(option: Option) {
    setSelected(option)
    setError('')
  }

  async function handleCreate() {
    if (!selected) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || selected.label,
          type: selected.type,
          slug: slugPreview,
          content: {},
          is_published: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create')

      // The edit token is shown exactly once, at creation. Carry it in the URL
      // so the creator can keep editing; the public link never contains it.
      const token = data.entry?.edit_token || ''
      router.push(`/create/${selected.type}/${data.entry.slug}${token ? `?token=${token}` : ''}`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <PublicShell>
      <div className="container py-10 space-y-8">
      <div className="flex items-center gap-3">
        <button onClick={() => (selected ? setSelected(null) : router.push('/'))} className="btn btn-ghost p-2" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="heading">{selected ? `Name your ${selected.label.toLowerCase()}` : 'What would you like to make?'}</h1>
          <p className="muted-foreground text-sm">
            {selected
              ? 'This is what you will see in your dashboard. Your public link uses it too.'
              : 'Pick a gift. You can change anything later.'}
          </p>
        </div>
      </div>

      {!selected ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon
            const accent = ACCENT_CLASSES[option.accent]
            return (
              <button
                key={option.type}
                onClick={() => choose(option)}
                className="card p-6 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <div className={`w-11 h-11 rounded-xl ${accent.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${accent.text}`} />
                </div>
                <h2 className="font-medium">{option.label}</h2>
                <p className="text-sm muted-foreground mt-1">{option.blurb}</p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="card p-6 space-y-5 max-w-xl">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${ACCENT_CLASSES[selected.accent].bg} flex items-center justify-center`}>
              <selected.icon className={`w-5 h-5 ${ACCENT_CLASSES[selected.accent].text}`} />
            </div>
            <div>
              <p className="font-medium">{selected.label}</p>
              <p className="text-sm muted-foreground">{selected.blurb}</p>
            </div>
            <Check className="w-5 h-5 text-green-600 ml-auto" />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={selected.label} maxLength={200}
              className="w-full px-3 py-2 rounded-xl bg-base border border-base focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-1">
              Public link name <span className="muted-foreground">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm muted-foreground whitespace-nowrap">/daily/</span>
              <input
                id="slug" value={slugPreview}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={slugify(title) || 'my-gift'}
                maxLength={60}
                className="flex-1 px-3 py-2 rounded-xl bg-base border border-base focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
              />
            </div>
            <p className="text-xs muted-foreground mt-1">Lowercase letters, numbers and dashes only.</p>
          </div>

          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="btn btn-ghost" disabled={submitting}>Back</button>
            <button onClick={handleCreate} className="btn btn-primary" disabled={submitting || !slugPreview}>
              {submitting ? 'Creating...' : 'Create'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
        )}
      </div>
    </PublicShell>
  )
}

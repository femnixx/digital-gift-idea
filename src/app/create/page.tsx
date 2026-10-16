'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Image, Camera, ScanFace, Clock, Coffee, AudioLines, Calendar, Check, ArrowRight, ArrowLeft
} from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button, Field } from '@/components/ui/primitives'
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
  { type: 'bucket_list', label: 'Bucket List', blurb: 'A wishlist of dreams and goals', icon: Calendar, accent: 'amber' },
  { type: 'scrapbook', label: 'Memory Scrapbook', blurb: 'Photos, notes, and decorations arranged on a canvas', icon: Image, accent: 'rose' },
  { type: 'polaroid', label: 'Polaroid Deck', blurb: 'Photo memories with tilt and hidden notes', icon: Camera, accent: 'amber' },
  { type: 'scratch_card', label: 'Scratch Card', blurb: 'A surprise hidden under a scratch-off cover', icon: ScanFace, accent: 'purple' },
  { type: 'open_when', label: 'Open When', blurb: 'Sealed envelopes that open on a trigger', icon: Clock, accent: 'rose' },
  { type: 'coffee_date', label: 'Coffee Date', blurb: 'A shared drink, across any timezone', icon: Coffee, accent: 'blue' },
  { type: 'voice_note', label: 'Voice Note', blurb: 'Your voice, on a cassette', icon: AudioLines, accent: 'pink' },
]

const ACCENT_CLASSES: Record<string, { bg: string; text: string }> = {
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
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

      // The edit token is shown exactly once, at creation, and is the only way
      // back in. The public link never carries it.
      const token = data.entry?.edit_token || ''
      router.push(`/create/${selected.type}/${data.entry.slug}${token ? `?token=${token}` : ''}`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <PublicShell>
      <div className="container-wide py-8 lg:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Button
            tone="neutral"
            size="sm"
            onClick={() => (selected ? setSelected(null) : router.push('/'))}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="heading">
              {selected ? `Name your ${selected.label.toLowerCase()}` : 'What would you like to make?'}
            </h1>
            <p className="muted-foreground mt-1">
              {selected
                ? 'This is what you will see in your dashboard. Your public link uses it too.'
                : 'Pick a gift. You can change anything later.'}
            </p>
          </div>
        </div>

        {/* Options: one column on a phone, two on a tablet, three on a laptop,
            four on a wide display, so nothing is squeezed into an unreadable column. */}
        {!selected ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {OPTIONS.map((option) => {
              const Icon = option.icon
              const accent = ACCENT_CLASSES[option.accent]
              return (
                <button
                  key={option.type}
                  onClick={() => setSelected(option)}
                  className="card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${accent.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 lg:w-7 lg:h-7 ${accent.text}`} />
                  </div>
                  <h2 className="text-lg font-medium">{option.label}</h2>
                  <p className="text-sm muted-foreground mt-1">{option.blurb}</p>
                </button>
              )
            })}
          </div>
        ) : (
          /* The form widens as the viewport grows rather than staying phone-width. */
          <div className="card card-lg max-w-2xl xl:max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${ACCENT_CLASSES[selected.accent].bg} flex items-center justify-center shrink-0`}>
                <selected.icon className={`w-6 h-6 lg:w-7 lg:h-7 ${ACCENT_CLASSES[selected.accent].text}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{selected.label}</p>
                <p className="text-sm muted-foreground">{selected.blurb}</p>
              </div>
              <Check className="w-5 h-5 text-green-600 ml-auto shrink-0" />
            </div>

            <Field label="Name">
              <input
                id="title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selected.label}
                maxLength={200}
              />
            </Field>

            <Field label="Public link name" optional hint="Lowercase letters, numbers and dashes only.">
              <div className="flex items-center gap-2">
                <span className="text-sm muted-foreground whitespace-nowrap hidden sm:inline">/daily/</span>
                <input
                  id="slug"
                  className="input font-mono"
                  value={slugPreview}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder={slugify(title) || 'my-gift'}
                  maxLength={60}
                />
              </div>
            </Field>

            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button tone="neutral" onClick={() => setSelected(null)} disabled={submitting}>
                Back
              </Button>
              <Button size="lg" onClick={handleCreate} disabled={submitting || !slugPreview}>
                {submitting ? 'Creating...' : 'Create'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  )
}

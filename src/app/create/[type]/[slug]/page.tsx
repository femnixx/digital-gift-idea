'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PublicShell } from '@/components/layout/PublicShell'
import { LetterEditor } from '@/components/features/LetterEditor'
import { BouquetEditor } from '@/components/features/BouquetEditor'
import { PolaroidCustomizer } from '@/components/features/PolaroidCustomizer'
import { ScratchCardCustomizer } from '@/components/features/ScratchCardCustomizer'
import { VoiceNoteRecorder } from '@/components/features/VoiceNoteRecorder'
import { CoffeeDateSelector } from '@/components/features/CoffeeDateSelector'
import { GIFT_LABELS } from '@/lib/gifts/catalog'
import { SharePanel } from '@/components/share/SharePanel'
import type { Entry, EntryType } from '@/types'

/**
 * Creation surface for one gift. The entry already exists (created by /create),
 * so this page is where the visitor actually builds what they chose. Only the
 * owner may load it.
 */
export default function CreateEntryPage() {
  const params = useParams<{ type: string; slug: string }>()
  const type = (params?.type || 'letter') as EntryType
  const slug = String(params?.slug || '')

  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/entries/${encodeURIComponent(slug)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Could not load this gift')
        }
        const data = await res.json()
        if (!cancelled) setEntry(data.entry as Entry)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  async function saveLetterContent(content: Record<string, any>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not save')
      }
      setNotice('Saved')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not publish')
      }
      setEntry((prev) => (prev ? { ...prev, is_published: true } : prev))
      setNotice('Published. Your link is live.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const editor = useMemo(() => {
    if (!slug) return null

    switch (type) {
      case 'letter':
        return (
          <LetterEditor
            entry={entry}
            mode="edit"
            onSave={(content) => saveLetterContent({ ...(entry?.content || {}), ...content })}
          />
        )
      case 'bouquet':
        return <BouquetEditor entryId={slug} onSave={() => setNotice('Bouquet saved')} />
      case 'polaroid':
        return (
          <PolaroidCustomizer
            entryId={slug}
            card={null}
            onSave={() => setNotice('Polaroid saved')}
          />
        )
      case 'scratch_card':
        return (
          <ScratchCardCustomizer
            entryId={slug}
            card={null}
            onSave={() => setNotice('Scratch card saved')}
          />
        )
      case 'voice_note':
        return <VoiceNoteRecorder entryId={slug} onSave={() => setNotice('Voice note saved')} />
      case 'coffee_date':
        return (
          <CoffeeDateSelector
            entryId={slug}
            mode="create"
            onSave={() => setNotice('Coffee date saved')}
          />
        )
      case 'open_when':
        return (
          <div className="card p-6 space-y-3">
            <h2 className="font-serif text-lg">Open When envelopes</h2>
            <p className="text-sm muted-foreground">
              Add your envelopes from the gift builder. Each one is sealed until its moment arrives.
            </p>
            <p className="text-sm muted-foreground">
              This gift is authored in place and shared with your link.
            </p>
          </div>
        )
      default:
        return <p className="text-sm text-red-600">Unknown gift type.</p>
    }
  }, [type, slug, entry])

  const label = GIFT_LABELS[type] || 'Gift'

  return (
    <PublicShell>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/create" className="text-sm underline muted-foreground">All options</Link>
            <h1 className="heading">{label}</h1>
            <p className="text-sm muted-foreground">/daily/{slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={publish} disabled={publishing || !entry} className="btn btn-primary">
              {publishing ? 'Publishing...' : entry?.is_published ? 'Published' : 'Publish'}
            </button>
            {entry?.is_published ? (
              <Link href={`/daily/${slug}`} className="btn btn-ghost">View public page</Link>
            ) : null}
          </div>
        </div>

        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        {notice ? <p className="text-sm text-green-600">{notice}</p> : null}
        {saving ? <p className="text-sm muted-foreground">Saving...</p> : null}

        {!loading && entry?.is_published ? <SharePanel slug={slug} /> : null}

        {loading ? (
          <div className="card p-6 space-y-3">
            <div className="animate-pulse h-4 w-1/3 bg-stone-200 dark:bg-stone-700 rounded" />
            <div className="animate-pulse h-32 w-full bg-stone-200 dark:bg-stone-700 rounded" />
          </div>
        ) : (
          <div className="space-y-6">{editor}</div>
        )}
      </div>
    </PublicShell>
  )
}

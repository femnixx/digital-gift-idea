'use client'

import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import { PublicShell } from '@/components/layout/PublicShell'
import { Scrapbook } from '@/components/features/Scrapbook'
import type { Entry, ScrapbookPage, Media } from '@/types'

interface ScrapbookPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default function ScrapbookEditorPage({ params, searchParams }: ScrapbookPageProps) {
  const { slug } = use(params)
  const { token } = use(searchParams)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scrapbookPages, setScrapbookPages] = useState<ScrapbookPage[]>([])
  const [mediaItems, setMediaItems] = useState<Media[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const entryUrl = `/api/entries/${encodeURIComponent(slug)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
        const res = await fetch(entryUrl, { redirect: 'manual' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setEntry(data.entry)
        setScrapbookPages(data.entry.scrapbook_pages || [])
        setMediaItems(data.entry.media || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, token])

  if (loading) {
    return (
      <PublicShell>
        <div className="container-wide py-8 lg:py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-base-2 rounded w-3/4" />
            <div className="h-4 bg-base-2 rounded w-1/2" />
            <div className="h-96 bg-base-2 rounded" />
          </div>
        </div>
      </PublicShell>
    )
  }

  if (error) {
    return (
      <PublicShell>
        <div className="container-wide py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </PublicShell>
    )
  }

  if (!entry) return null

  return (
    <PublicShell>
      <div className="container-wide py-8 lg:py-12">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.header
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading">{entry.title || 'Memory Scrapbook'}</h1>
            <p className="muted-foreground mt-1">
              Arrange your photos, add captions, and decorate your story
            </p>
          </motion.header>

          <div className="card card-lg">
            <div className="p-4 sm:p-6">
              <Scrapbook
                pages={scrapbookPages}
                media={mediaItems}
                entryId={entry.id}
                isEditing={!!token}
                onSave={(updated) => {
                  setScrapbookPages(updated)
                  setEntry({ ...entry, scrapbook_pages: updated })
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </PublicShell>
  )
}

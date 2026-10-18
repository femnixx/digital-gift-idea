'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Tag, Heart, Share2, Copy, Check, Edit3, Plus, Trash2 } from 'lucide-react'
import { useNav } from '@/hooks/useNav'
import { format } from 'date-fns'
import { BucketList } from '@/components/features/BucketList'
import { GiftOpening } from '@/components/gift/GiftOpening'
import { PublicShell } from '@/components/layout/PublicShell'
import type { Entry, BucketListItem } from '@/types'
import { resolveEntryByIdOrSlug } from '@/lib/repositories/entryRepository'

interface BucketListPageProps {
  params: { slug: string }
  searchParams: { token?: string }
}

export default function BucketListEditorPage({ params, searchParams }: BucketListPageProps) {
  const { slug } = params
  const { token } = searchParams
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bucketListItems, setBucketListItems] = useState<BucketListItem[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const url = `/api/entries/${encodeURIComponent(slug)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
        const res = await fetch(url, { redirect: 'manual' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setEntry(data.entry)
        setBucketListItems(data.entry.bucket_list || [])
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
            <div className="h-64 bg-base-2 rounded" />
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
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.header
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading">{entry.title || 'Bucket List'}</h1>
            <p className="muted-foreground mt-1">
              Dream, plan, and track your goals together
            </p>
          </motion.header>

          <div className="card card-lg">
            <div className="p-4 sm:p-6">
              <BucketList
                items={bucketListItems}
                entryId={entry.id}
                isEditing={!!token}
                onSave={(updated) => {
                  setBucketListItems(updated)
                  setEntry({ ...entry, bucket_list: updated })
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </PublicShell>
  )
}

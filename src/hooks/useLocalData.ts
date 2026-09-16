'use client'

import { useState, useEffect } from 'react'
import { db, type Entry, type Media } from '@/lib/storage/localStorageDB'

export function useLocalEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries(db.entries.list())
    setLoading(false)
  }, [])

  const refresh = () => setEntries(db.entries.list())

  return { entries, loading, refresh }
}

export function useLocalEntry(slug: string) {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = db.entries.getBySlug(slug)
    setEntry(found || null)
    setLoading(false)
  }, [slug])

  const refresh = () => {
    const found = db.entries.getBySlug(slug)
    setEntry(found || null)
  }

  return { entry, loading, refresh }
}

export function useLocalMedia(entryId: string) {
  const [media, setMedia] = useState<Media[]>([])

  useEffect(() => {
    setMedia(db.media.getByEntry(entryId))
  }, [entryId])

  const refresh = () => setMedia(db.media.getByEntry(entryId))

  return { media, refresh }
}

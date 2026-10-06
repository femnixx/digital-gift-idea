'use client'

import { useState, useEffect } from 'react'
import { db, type Entry, type Media } from '@/lib/storage/localStorageDB'
import { getTempEntries, isTempSlug } from '@/lib/tempStorage'

export function useLocalEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localEntries = db.entries.list()
    const tempEntries = getTempEntries()
    setEntries([...tempEntries, ...localEntries])
    setLoading(false)
  }, [])

  const refresh = () => {
    const localEntries = db.entries.list()
    const tempEntries = getTempEntries()
    setEntries([...tempEntries, ...localEntries])
  }

  return { entries, loading, refresh }
}

export function useLocalEntry(slug: string) {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isTempSlug(slug)) {
      const tempEntries = getTempEntries()
      const found = tempEntries.find((e) => e.slug === slug) || null
      setEntry(found)
      setLoading(false)
      return
    }
    const found = db.entries.getBySlug(slug)
    setEntry(found || null)
    setLoading(false)
  }, [slug])

  const refresh = () => {
    if (isTempSlug(slug)) {
      const tempEntries = getTempEntries()
      setEntry(tempEntries.find((e) => e.slug === slug) || null)
      return
    }
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

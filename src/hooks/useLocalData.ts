'use client'

import { useState, useEffect } from 'react'
import { getTempEntries, isTempSlug } from '@/lib/tempStorage'
import type { Entry, Media } from '@/types'

export function useLocalEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localEntries = getTempEntries()
    setEntries(localEntries)
    setLoading(false)
  }, [])

  const refresh = () => {
    const localEntries = getTempEntries()
    setEntries(localEntries)
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
    setEntry(null)
    setLoading(false)
  }, [slug])

  const refresh = () => {
    if (isTempSlug(slug)) {
      const tempEntries = getTempEntries()
      setEntry(tempEntries.find((e) => e.slug === slug) || null)
      return
    }
    setEntry(null)
  }

  return { entry, loading, refresh }
}

export function useLocalMedia(entryId: string) {
  const [media, setMedia] = useState<Media[]>([])

  useEffect(() => {
    setMedia([])
  }, [entryId])

  const refresh = () => setMedia([])

  return { media, refresh }
}

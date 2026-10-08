'use client'

import { useState, useEffect } from 'react'
import type { Entry, Media } from '@/types'

export function useLocalEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries([])
    setLoading(false)
  }, [])

  const refresh = () => {
    setEntries([])
  }

  return { entries, loading, refresh }
}

export function useLocalEntry(_slug: string) {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntry(null)
    setLoading(false)
  }, [_slug])

  const refresh = () => {
    setEntry(null)
  }

  return { entry, loading, refresh }
}

export function useLocalMedia(_entryId: string) {
  const [media, setMedia] = useState<Media[]>([])

  useEffect(() => {
    setMedia([])
  }, [_entryId])

  const refresh = () => setMedia([])

  return { media, refresh }
}

'use client'

import { useEffect, useState } from 'react'

export function useDemoEntries() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/public/entries')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setEntries(data.entries || [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { entries, loading }
}

export function useDemoEntry(slug: string) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/public/entries/${slug}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setEntry(data.entry)
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { entry, loading }
}

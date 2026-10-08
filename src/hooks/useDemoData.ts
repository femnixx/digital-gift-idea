'use client'

import { useEffect, useState } from 'react'
import { getTempEntries } from '@/lib/tempStorage'

export function useDemoEntries() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/public/entries')
        if (res.ok) {
          const data = await res.json()
          setEntries(data.entries || [])
        } else {
          const storage = localStorage.getItem('digital-love-letters-demo')
          const demoEntries = storage ? JSON.parse(storage).entries || [] : []
          const tempEntries = getTempEntries()
          const tempIds = new Set(tempEntries.map((e: any) => e.id))
          const filteredDemo = demoEntries.filter((e: any) => !tempIds.has(e.id))
          setEntries([...tempEntries, ...filteredDemo])
        }
      } catch {
        const storage = localStorage.getItem('digital-love-letters-demo')
        const demoEntries = storage ? JSON.parse(storage).entries || [] : []
        const tempEntries = getTempEntries()
        const tempIds = new Set(tempEntries.map((e: any) => e.id))
        const filteredDemo = demoEntries.filter((e: any) => !tempIds.has(e.id))
        setEntries([...tempEntries, ...filteredDemo])
      }
      setLoading(false)
    }

    fetchEntries()
  }, [])

  return { entries, loading }
}

export function useDemoEntry(slug: string) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await fetch(`/api/public/entries/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setEntry(data.entry)
        } else {
          const tempEntries = getTempEntries()
          const tempEntry = tempEntries.find((e: any) => e.slug === slug)
          if (tempEntry) {
            setEntry(tempEntry)
            setLoading(false)
            return
          }
          const storage = localStorage.getItem('digital-love-letters-demo')
          if (storage) {
            const data = JSON.parse(storage)
            const found = data.entries?.find((e: any) => e.slug === slug)
            if (found) {
              found.media = data.media?.filter((m: any) => m.entry_id === found.id) || []
              found.bouquet_flowers = data.bouquet_flowers?.filter((f: any) => f.entry_id === found.id) || []
              found.polaroid_cards = data.polaroid_cards?.filter((p: any) => p.entry_id === found.id) || []
              found.scratch_cards = data.scratch_cards?.filter((s: any) => s.entry_id === found.id) || []
              found.open_when_letters = data.open_when_letters?.filter((l: any) => l.entry_id === found.id) || []
              found.coffee_dates = data.coffee_dates?.filter((c: any) => c.entry_id === found.id) || []
              found.voice_notes = data.voice_notes?.filter((v: any) => v.entry_id === found.id) || []

              const now = new Date()
              if (found.open_when_letters) {
                found.open_when_letters = found.open_when_letters.map((letter: any) => {
                  let isUnlocked = letter.is_unlocked
                  if (!isUnlocked && letter.trigger_type === 'date' && letter.trigger_value) {
                    isUnlocked = new Date(letter.trigger_value) <= now
                  }
                  return { ...letter, is_unlocked: isUnlocked }
                })
              }

              setEntry(found)
            }
          }
        }
      } catch {}
      setLoading(false)
    }

    fetchEntry()
  }, [slug])

  return { entry, loading }
}

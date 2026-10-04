'use client'

import type { EntryType, UnlockCondition } from '@/types'

const TEMP_STORAGE_KEY = 'digital-love-letters-temp'

export interface TempEntry {
  id: string
  slug: string
  title: string
  type: EntryType
  content: Record<string, any>
  publish_at: string
  unlock_at: string | null
  unlock_condition: UnlockCondition | null
  is_published: boolean
  is_featured: boolean
  view_count: number
  created_by: string
  created_at: string
  updated_at: string
  media?: any[]
  bouquet_flowers?: any[]
  polaroid_cards?: any[]
  scratch_cards?: any[]
  open_when_letters?: any[]
  coffee_dates?: any[]
  voice_notes?: any[]
}

function readTempDB(): TempEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(TEMP_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function writeTempDB(entries: TempEntry[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

export function getTempEntries(): TempEntry[] {
  return readTempDB()
}

export function addTempEntry(entry: TempEntry): void {
  const entries = readTempDB()
  entries.unshift(entry)
  writeTempDB(entries)
}

export function updateTempEntry(id: string, patch: Partial<TempEntry>): void {
  const entries = readTempDB()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...patch, updated_at: new Date().toISOString() }
    writeTempDB(entries)
  }
}

export function removeTempEntry(id: string): void {
  const entries = readTempDB()
  writeTempDB(entries.filter((e) => e.id !== id))
}

export function clearTempEntries(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TEMP_STORAGE_KEY)
}

export function generateTempSlug(): string {
  return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
}

export function isTempSlug(slug: string): boolean {
  return slug.startsWith('tmp-')
}

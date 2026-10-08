'use client'

import { DemoDataProvider } from '@/lib/demo/DemoDataProvider'
import { addTempEntry, generateTempSlug, isTempSlug } from '@/lib/tempStorage'
import type { Entry } from '@/types'

export interface SaveEntryResult {
  success: boolean
  entry?: Entry
  error?: string
}

export async function saveEntryToStorage(entry: Entry): Promise<SaveEntryResult> {
  const slug = entry.slug?.trim() ? entry.slug : generateTempSlug()

  const tempEntry: Entry = {
    ...entry,
    slug,
  }

  if (isTempSlug(tempEntry.slug)) {
    addTempEntry(tempEntry as any)
  } else {
    const storage = DemoDataProvider.getStorage()
    const existingEntries = storage.entries || []
    existingEntries.unshift(tempEntry)
    storage.entries = existingEntries
    DemoDataProvider.setStorage(storage)
  }

  return { success: true, entry: tempEntry }
}

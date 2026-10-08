'use client'

import type { Entry } from '@/types'

export interface SaveEntryResult {
  success: boolean
  entry?: Entry
  error?: string
}

export async function saveEntryToStorage(_entry: Entry): Promise<SaveEntryResult> {
  return { success: false, error: 'Not implemented' }
}

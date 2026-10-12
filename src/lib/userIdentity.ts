'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Remembers the visitor's display name locally so the landing greeting and the
 * creation flow can address them before any server round-trip. Authentication
 * itself lives entirely in the session cookie.
 */
const KEY = 'dll:user-name'

export function getUserName(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(KEY) || ''
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return
  if (name) window.localStorage.setItem(KEY, name)
  else window.localStorage.removeItem(KEY)
}

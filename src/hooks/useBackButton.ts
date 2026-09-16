'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useBackButton(defaultPath = '/') {
  const router = useRouter()
  const back = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(defaultPath)
    }
  }, [router, defaultPath])

  return back
}

'use client'

import { useEffect } from 'react'

export function ThemeScript() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dll-theme')
      const theme = stored === 'romantic' ? 'romantic' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
    } catch {}
  }, [])

  return null
}

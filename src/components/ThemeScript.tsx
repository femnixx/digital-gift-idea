'use client'

import { useEffect } from 'react'

export function ThemeScript() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem('love-letters-theme')
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      }
    } catch {}
  }, [])

  return null
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'romantic'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('dll-theme') as Theme | null
      if (stored === 'light' || stored === 'romantic') {
        setTheme(stored)
        document.documentElement.setAttribute('data-theme', stored)
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
      }
    } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'romantic' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      try {
        localStorage.setItem('dll-theme', next)
      } catch {}
      return next
    })
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useColorTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return { theme: 'light' as Theme, setTheme: () => {}, toggleTheme: () => {} }
  }
  return context
}

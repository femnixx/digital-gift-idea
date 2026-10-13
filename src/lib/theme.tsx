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
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  /**
   * Applies a palette everywhere it has to go.
   *
   * The colours are CSS variables scoped to `[data-theme="…"]` on <html>, so
   * moving React state alone changes nothing on screen — the attribute has to
   * move as well. This used to be missing from setTheme, which is why the Sky
   * and Romantic buttons did nothing: only toggleTheme touched the document.
   */
  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('dll-theme', next)
    } catch {
      // Private browsing or storage disabled: the palette still applies for this
      // session, it just will not be remembered.
    }
  }, [])

  const setTheme = useCallback((next: Theme) => applyTheme(next), [applyTheme])

  const toggleTheme = useCallback(
    () => applyTheme(theme === 'light' ? 'romantic' : 'light'),
    [applyTheme, theme]
  )

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('dll-theme')
      applyTheme(stored === 'romantic' ? 'romantic' : 'light')
    } catch {
      applyTheme('light')
    }
  }, [applyTheme])

  // Render children before mounting so the first paint is not delayed, but only
  // advertise the real setters once mounted, so a click cannot be swallowed by a
  // no-op fallback.
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
    // Returning a no-op here hides wiring mistakes. Anything consuming this hook
    // should sit inside ThemeProvider; the fallback exists only so a stray
    // consumer cannot crash the tree.
    return { theme: 'light' as Theme, setTheme: () => {}, toggleTheme: () => {} }
  }
  return context
}

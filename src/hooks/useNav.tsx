'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface NavContextValue {
  push: (path: string) => void
  back: (fallback?: string) => void
  replace: (path: string) => void
  canGoBack: boolean
}

const NavContext = createContext<NavContextValue | undefined>(undefined)

export function NavProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [history, setHistory] = useState<string[]>([])

  const push = useCallback((path: string) => {
    setHistory(prev => [...prev, path])
    router.push(path)
  }, [router])

  const back = useCallback((fallback = '/') => {
    setHistory(prev => {
      if (prev.length > 0) {
        const newHistory = [...prev]
        newHistory.pop()
        return newHistory
      }
      return prev
    })
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }, [router])

  const replace = useCallback((path: string) => {
    router.replace(path)
  }, [router])

  return (
    <NavContext.Provider value={{ push, back, replace, canGoBack: history.length > 0 }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}

'use client'

import { useColorTheme } from '@/lib/theme'
import { Heart, Palette } from 'lucide-react'

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useColorTheme()

  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-base shadow-sm ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          theme === 'light'
            ? 'btn-primary'
            : 'muted hover:bg-base/50'
        }`}
      >
        <Palette className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-white' : ''}`} />
        Sky
      </button>
      <button
        onClick={() => setTheme('romantic')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          theme === 'romantic'
            ? 'btn-primary'
            : 'muted hover:bg-base/50'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${theme === 'romantic' ? 'text-white' : ''}`} />
        Romantic
      </button>
    </div>
  )
}

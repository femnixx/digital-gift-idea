'use client'

import { useColorTheme } from '@/lib/theme'
import { Sun, Moon } from 'lucide-react'

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useColorTheme()

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-base shadow-subtle ${className}`}
      role="group"
      aria-label="Theme"
    >
      <button
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          theme === 'light' ? 'btn-primary' : 'muted hover:bg-base/50'
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-white' : ''}`} />
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          theme === 'dark' ? 'btn-primary' : 'muted hover:bg-base/50'
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-white' : ''}`} />
        Dark
      </button>
    </div>
  )
}
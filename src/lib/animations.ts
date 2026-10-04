'use client'

import { useEffect, useRef } from 'react'

type Theme = 'light' | 'dark'

const THEME_COLORS = {
  light: {
    bg: '#f8fbff',
    text: '#1a3a52',
    accent: '#5b9bd5',
    card: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(212, 230, 247, 0.9)',
    shadow: 'rgba(91, 155, 213, 0.12)',
  },
  dark: {
    bg: '#0f1b2e',
    text: '#e8f0f8',
    accent: '#8db4e8',
    card: 'rgba(26, 47, 71, 0.85)',
    border: 'rgba(42, 69, 99, 0.9)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
}

export function useThemeAnimations(theme: Theme) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current || document.documentElement
    const colors = THEME_COLORS[theme]

    // Smoothly animate CSS variables using GSAP-like CSS transitions
    root.style.setProperty('--theme-bg', colors.bg)
    root.style.setProperty('--theme-text', colors.text)
    root.style.setProperty('--theme-accent', colors.accent)
    root.style.setProperty('--theme-card', colors.card)
    root.style.setProperty('--theme-border', colors.border)
    root.style.setProperty('--theme-shadow', colors.shadow)
  }, [theme])
}

export function useMagneticButton(ref: React.RefObject<HTMLButtonElement | HTMLAnchorElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`
      el.style.transition = 'transform 0.15s ease-out'
    }

    const handleMouseLeave = () => {
      el.style.transform = 'translate(0, 0)'
      el.style.transition = 'transform 0.4s ease-out'
    }

    el.addEventListener('mousemove', handleMouseMove as EventListener)
    el.addEventListener('mouseleave', handleMouseLeave as EventListener)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove as EventListener)
      el.removeEventListener('mouseleave', handleMouseLeave as EventListener)
    }
  }, [ref])
}

export function useSparkleBurst(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('span')
        spark.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--sparkle, #38bdf8);
          pointer-events: none;
          animation: sparkleBurst 0.6s ease-out forwards;
          --burst-x: ${(Math.random() - 0.5) * 80}px;
          --burst-y: ${(Math.random() - 0.5) * 80}px;
        `
        el.appendChild(spark)
        setTimeout(() => spark.remove(), 600)
      }
    }

    el.addEventListener('click', handleClick as EventListener)
    return () => el.removeEventListener('click', handleClick as EventListener)
  }, [ref])
}

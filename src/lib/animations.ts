'use client'

import { useEffect, useRef } from 'react'

type Theme = 'light' | 'romantic'

const THEME_COLORS = {
  light: {
    bg: '#f0f9ff',
    text: '#0c4a6e',
    accent: '#0ea5e9',
    card: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(186, 230, 253, 0.6)',
    shadow: 'rgba(14, 165, 233, 0.12)',
  },
  romantic: {
    bg: '#1a0a0a',
    text: '#fecdd3',
    accent: '#f43f5e',
    card: 'rgba(42, 16, 16, 0.85)',
    border: 'rgba(244, 63, 94, 0.25)',
    shadow: 'rgba(244, 63, 94, 0.18)',
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

'use client'

import { useEffect, useRef, useState } from 'react'

const THEME_KEY = 'dll-theme'

type Theme = 'light' | 'romantic'

function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null
      if (stored === 'light' || stored === 'romantic') {
        setTheme(stored)
        document.documentElement.setAttribute('data-theme', stored)
      }
    } catch {}
  }, [])

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'romantic' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {}
      return next
    })
  }

  return { theme, toggle }
}

export default function PerformanceLanding() {
  const { theme, toggle } = useTheme()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Entrance animation using GSAP-like CSS transitions
    if (titleRef.current) {
      titleRef.current.classList.add('anim-fade-up')
      setTimeout(() => titleRef.current?.classList.add('visible'), 50)
    }

    // Stagger card reveals
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.card')
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('anim-fade-up'), 150 + i * 80)
        setTimeout(() => card.classList.add('visible'), 180 + i * 80)
      })
    }
  }, [])

  const features = [
    { title: 'Love Letters', desc: 'Write heartfelt messages with beautiful typography and animations.', Icon: HeartSvg },
    { title: 'Digital Bouquets', desc: 'Send flowers that never wilt, crafted with color and motion.', Icon: BouquetSvg },
    { title: 'Voice Notes', desc: 'Record audio memories with waveform visuals and cassette styling.', Icon: VoiceSvg },
    { title: 'Polaroids', desc: 'Share photo memories with tilt, stickers, and hidden notes.', Icon: PolaroidSvg },
    { title: 'Scratch Cards', desc: 'Reveal surprises underneath interactive scratch-off covers.', Icon: ScratchSvg },
    { title: 'Coffee Dates', desc: 'Schedule virtual coffee moments with drink pickers and timers.', Icon: CoffeeSvg },
  ]

  return (
    <div className="theme-transition">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <FloatingHearts />
      <Sparkles />

      <div className="theme-toggle">
        <button
          onClick={toggle}
          className={theme === 'light' ? 'active' : ''}
          aria-label="Switch to light blue theme"
        >
          <BlueSvg />
          Sky
        </button>
        <button
          onClick={toggle}
          className={theme === 'romantic' ? 'active' : ''}
          aria-label="Switch to dark red theme"
        >
          <RedSvg />
          Romantic
        </button>
      </div>

      <section className="section" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ textAlign: 'center', paddingTop: 100, paddingBottom: 40 }}>
          <h1 ref={titleRef} className="hero-title">
            Digital Love Letters
          </h1>
          <p className="hero-subtitle">
            A private digital sanctuary where distance disappears.
            Create personalized gifts that speak straight to the heart.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/login" className="btn btn-primary">Sign In</a>
            <a href="/signup" className="btn btn-secondary">Get Started</a>
          </div>
        </div>
      </section>

      <section className="section" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div ref={cardsRef} className="grid">
            {features.map(({ title, desc, Icon }) => (
              <a key={title} href="/login" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                     background: 'rgb(var(--card-border) / 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
                </div>
                 <p style={{ fontSize: 14, color: 'rgb(var(--muted))', lineHeight: 1.55 }}>{desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function HeartSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BouquetSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15" />
    </svg>
  )
}

function VoiceSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function PolaroidSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function ScratchSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

function CoffeeSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}

function BlueSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function RedSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function FloatingHearts() {
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 12 + Math.random() * 14,
    duration: 14 + Math.random() * 12,
    delay: Math.random() * 6,
  }))

  return (
    <div className="floating-hearts" aria-hidden="true">
      {hearts.map(h => (
        <svg
          key={h.id}
          className="heart"
          style={{
            left: `${h.left}%`,
            top: `${h.top}%`,
            width: h.size,
            height: h.size,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ))}
    </div>
  )
}

function Sparkles() {
  const dots = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 4,
  }))

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {dots.map(d => (
        <span
          key={d.id}
          className="sparkle"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

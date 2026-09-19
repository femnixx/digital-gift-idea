'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useColorTheme } from '@/lib/theme'

type Theme = 'light' | 'romantic'

function HeartSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function FloatingHearts() {
  const hearts = Array.from({ length: 10 }, (_, i) => ({
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
  const dots = Array.from({ length: 20 }, (_, i) => ({
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

export default function HomePage() {
  const router = useRouter()
  const { theme } = useColorTheme()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.classList.add('anim-fade-up')
      requestAnimationFrame(() => {
        titleRef.current?.classList.add('visible')
      })
    }

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.card')
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('anim-fade-up'), 200 + i * 80)
        setTimeout(() => card.classList.add('visible'), 240 + i * 80)
      })
    }
  }, [])

  const features = [
    { title: 'Love Letters', desc: 'Write heartfelt messages with beautiful typography and animations.', Icon: HeartSvg },
    { title: 'Digital Bouquets', desc: 'Send flowers that never wilt, crafted with color and motion.', Icon: HeartSvg },
    { title: 'Voice Notes', desc: 'Record audio memories with waveform visuals and cassette styling.', Icon: HeartSvg },
    { title: 'Polaroids', desc: 'Share photo memories with tilt, stickers, and hidden notes.', Icon: HeartSvg },
    { title: 'Scratch Cards', desc: 'Reveal surprises underneath interactive scratch-off covers.', Icon: HeartSvg },
    { title: 'Coffee Dates', desc: 'Schedule virtual coffee moments with drink pickers and timers.', Icon: HeartSvg },
  ]

  return (
    <div className="theme-transition">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <FloatingHearts />
      <Sparkles />

      <div className="theme-toggle">
        <ThemeSwitcher />
      </div>

      <section className="section" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ textAlign: 'center', paddingTop: 100, paddingBottom: 40 }}>
          <h1 ref={titleRef} className="hero-title" style={{ fontFamily: 'var(--font-dancing), cursive' }}>
            Digital Love Letters
          </h1>
          <p className="hero-subtitle">
            A private digital sanctuary where distance disappears.
            Create personalized gifts that speak straight to the heart.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary">Sign In</Link>
            <Link href="/signup" className="btn btn-secondary">Get Started</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ title, desc, Icon }) => (
              <Link key={title} href="/login" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

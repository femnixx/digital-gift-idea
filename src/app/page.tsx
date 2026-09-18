'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'
import { Sun, Moon, Heart, Mail, Music, Camera, Gamepad2, Coffee, ArrowRight } from 'lucide-react'

function useStableRandoms(count: number) {
  const [randoms] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 12 + Math.random() * 12,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
    }))
  )
  return randoms
}

function useStableSparkles(count: number) {
  const [sparkles] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 4,
    }))
  )
  return sparkles
}

function useStableClouds(count: number) {
  const [clouds] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 60,
      width: 120 + Math.random() * 160,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.4,
    }))
  )
  return clouds
}

function FloatingHeart({ left, top, size, duration, delay, onHover }: { left: number; top: number; size: number; duration: number; delay: number; onHover?: () => void }) {
  return (
    <div
      className="absolute text-sky-200/15 dark:text-sky-900/20 pointer-events-none hover:opacity-80 transition-opacity cursor-default"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        fontSize: `${size}px`,
        animation: `floatHeart ${duration}s ease-in-out ${delay}s infinite`,
      }}
      onMouseEnter={onHover}
    >
      ♡
    </div>
  )
}

function SparkleComponent({ left, top, size, duration, delay, onClick }: { left: number; top: number; size: number; duration: number; delay: number; onClick?: () => void }) {
  return (
    <div
      className="absolute rounded-full bg-sky-300/40 dark:bg-sky-400/20 pointer-events-none cursor-pointer hover:bg-sky-400/60 transition-colors"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        animation: `pulseSparkle ${duration}s ease-in-out ${delay}s infinite`,
      }}
      onClick={onClick}
    />
  )
}

function Cloud({ left, top, width, duration, delay, opacity }: { left: number; top: number; width: number; duration: number; delay: number; opacity: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}px`,
        opacity,
        animation: `driftCloud ${duration}s ease-in-out ${delay}s infinite alternate`,
      }}
    >
      <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <ellipse cx="100" cy="45" rx="80" ry="28" fill="rgba(186,230,253,0.5)" />
        <ellipse cx="60" cy="40" rx="45" ry="25" fill="rgba(186,230,253,0.45)" />
        <ellipse cx="140" cy="38" rx="50" ry="22" fill="rgba(186,230,253,0.4)" />
      </svg>
    </div>
  )
}

function GradientBlob({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
  )
}

function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('love-letters-theme') === 'dark'
    setDark(isDark)
  }, [])

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('love-letters-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('love-letters-theme', 'light')
      }
      return next
    })
  }, [])

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-stone-200 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-700 transition-colors shadow-sm"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun className="w-5 h-5 text-sky-500" /> : <Moon className="w-5 h-5 text-stone-600" />}
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [sparkleBurst, setSparkleBurst] = useState<{ x: number; y: number; id: number }[]>([])
  const burstIdRef = useRef(0)

  const handleSparkleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const id = burstIdRef.current++
    setSparkleBurst(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }])
    setTimeout(() => {
      setSparkleBurst(prev => prev.filter(p => p.id !== id))
    }, 600)
  }, [])

  useEffect(() => {
    if (!heroRef.current) return

    const ctx = gsap.context(() => {}, heroRef.current)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from(titleRef.current, {
      y: 40,
      opacity: 0,
      duration: 1,
    })
      .from(subtitleRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
      }, '-0.5')
      .from(ctaRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
      }, '-0.3')

    return () => ctx.revert()
  }, [])

  const randoms = useStableRandoms(10)
  const sparkles = useStableSparkles(20)
  const clouds = useStableClouds(4)

  return (
    <>
      <DemoModeBanner />
      <DarkModeToggle />
      <div ref={heroRef} className="min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-sky-100/50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />

        <GradientBlob className="w-96 h-96 -top-20 -right-20 bg-sky-200/40" />
        <GradientBlob className="w-80 h-80 top-1/3 -left-32 bg-sky-100/60" />
        <GradientBlob className="w-64 h-64 bottom-20 right-1/4 bg-white/50" />

        {clouds.map((c, i) => (
          <Cloud key={`cloud-${i}`} {...c} />
        ))}

        {randoms.map((r, i) => (
          <FloatingHeart key={`heart-${i}`} {...r} onHover={() => {}} />
        ))}

        {sparkles.map((s, i) => (
          <div key={`sparkle-${i}`} onClick={handleSparkleClick}>
            <SparkleComponent {...s} />
          </div>
        ))}

        {sparkleBurst.map(b => (
          <div
            key={b.id}
            className="absolute pointer-events-none"
            style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)' }}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="absolute w-2 h-2 rounded-full bg-sky-400"
                style={{
                  animation: `sparkleBurst 0.6s ease-out forwards`,
                  transform: `translate(${(Math.random() - 0.5) * 60}px, ${(Math.random() - 0.5) * 60}px)`,
                  opacity: 1,
                }}
              />
            ))}
          </div>
        ))}

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
          <h1
            ref={titleRef}
            className="font-script text-5xl md:text-7xl font-light text-sky-600 dark:text-sky-300 mb-6"
          >
            Digital Love Letters
          </h1>
          <p
            ref={subtitleRef}
            className="font-serif text-xl md:text-2xl text-stone-600 dark:text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A private digital sanctuary where distance disappears.
            Create personalized gifts that speak straight to the heart.
          </p>
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors text-lg shadow-lg shadow-sky-200/50 dark:shadow-sky-900/20"
            >
              <span>Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-lg border border-stone-200 dark:border-stone-700"
            >
              <span>Get Started</span>
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Love Letters', desc: 'Write heartfelt messages with beautiful typography and animations.', icon: Mail, color: 'text-sky-600' },
              { title: 'Digital Bouquets', desc: 'Send flowers that never wilt, crafted with color and motion.', icon: Heart, color: 'text-rose-500' },
              { title: 'Voice Notes', desc: 'Record audio memories with waveform visuals and cassette styling.', icon: Music, color: 'text-violet-500' },
              { title: 'Polaroids', desc: 'Share photo memories with tilt, stickers, and hidden notes.', icon: Camera, color: 'text-amber-600' },
              { title: 'Scratch Cards', desc: 'Reveal surprises underneath interactive scratch-off covers.', icon: Gamepad2, color: 'text-emerald-600' },
              { title: 'Coffee Dates', desc: 'Schedule virtual coffee moments with drink pickers and timers.', icon: Coffee, color: 'text-orange-600' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-2xl border border-stone-200 dark:border-stone-700 p-6 text-left hover:-translate-y-1 transition-transform"
              >
                <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">{feature.title}</h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes floatHeart {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.5; }
          25% { transform: translateY(-30px) translateX(10px) rotate(5deg); opacity: 0.8; }
          50% { transform: translateY(-60px) translateX(-8px) rotate(-3deg); opacity: 0.5; }
          75% { transform: translateY(-40px) translateX(5px) rotate(2deg); opacity: 0.7; }
        }
        @keyframes pulseSparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes driftCloud {
          0% { transform: translateX(0); }
          100% { transform: translateX(40px); }
        }
        @keyframes sparkleBurst {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--burst-x, 30px), var(--burst-y, 30px)) scale(0); }
        }
      `}</style>
    </>
  )
}

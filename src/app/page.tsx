'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)

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

    const hearts = (ctx.selector ? ctx.selector('.floating-heart') : []) as HTMLElement[]

    hearts.forEach((heart: HTMLElement, i: number) => {
      const timeline = gsap.timeline({
        repeat: -1,
        defaults: { ease: 'none' },
      })

      timeline.to(heart, {
        y: -window.innerHeight * 0.3,
        x: (Math.random() - 0.5) * 100,
        rotation: 360,
        opacity: 0.3,
        duration: 15 + Math.random() * 10,
      })

      timeline.from(heart, {
        delay: Math.random() * 5,
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      <DemoModeBanner />
      <div ref={heroRef} className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 romantic-bg" />

        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="floating-heart absolute text-rose-200/20 dark:text-rose-900/30 text-2xl pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${12 + Math.random() * 12}px`,
            }}
          >
            ♡
          </div>
        ))}

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
          <h1
            ref={titleRef}
            className="font-script text-5xl md:text-7xl font-light text-rose-600 dark:text-rose-300 mb-6"
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
          <Link
            href="/admin/entries/new"
            ref={ctaRef}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors text-lg"
          >
            <span>Create Your First Love Letter</span>
          </Link>
        </div>
      </div>
    </>
  )
}

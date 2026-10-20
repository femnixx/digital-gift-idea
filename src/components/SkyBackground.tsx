'use client'

import { useEffect } from 'react'

const clouds = [
  { top: '8%', scale: 1.2, dur: 220, delay: -40, layer: 1 },
  { top: '22%', scale: 0.8, dur: 140, delay: -90, layer: 2 },
  { top: '38%', scale: 1.0, dur: 180, delay: -10, layer: 1 },
  { top: '55%', scale: 0.6, dur: 90, delay: -60, layer: 3 },
  { top: '68%', scale: 0.9, dur: 150, delay: -120, layer: 2 },
  { top: '82%', scale: 0.7, dur: 110, delay: -30, layer: 3 },
]

function Cloud() {
  return (
    <svg viewBox="0 0 220 90" width="220" height="90">
      <g fill="currentColor">
        <circle cx="60" cy="55" r="28" />
        <circle cx="100" cy="40" r="36" />
        <circle cx="145" cy="52" r="30" />
        <rect x="40" y="55" width="130" height="28" rx="14" />
      </g>
    </svg>
  )
}

export function SkyBackground() {
  useEffect(() => {
    const on = () =>
      document.documentElement.classList.toggle(
        'sky-paused',
        document.hidden
      )
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <div aria-hidden className="sky">
      <div className="sky-wash" />
      <div className="sky-stars">
        {Array.from({ length: 60 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 70}%`,
              animationDuration: `${3 + (i % 5)}s`,
              animationDelay: `${-(i % 7)}s`,
            }}
          />
        ))}
      </div>
      {clouds.map((c, i) => (
        <div
          key={i}
          className={`cloud layer-${c.layer}`}
          style={{
            top: c.top,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
            '--s': c.scale,
          } as React.CSSProperties}
        >
          <Cloud />
        </div>
      ))}
      <svg
        className="plane"
        viewBox="0 0 60 30"
        width="60"
        height="30"
      >
        <path
          d="M2 15 L58 2 L40 28 L32 18 Z M32 18 L58 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

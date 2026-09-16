'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FlowerType } from '@/types'

// --- Seeded Random (Mulberry32) ---
function mulberry32(a: number) {
  return function() {
    a |= 0
    a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function createRng(seed: number) {
  return mulberry32(seed)
}

// --- Color Utilities ---
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function varyColor(hex: string, seed: number, hueShift = 15, satShift = 10, lightShift = 10): string {
  const hsl = hexToHSL(hex)
  const rng = createRng(seed)
  const h = (hsl.h + (rng() - 0.5) * hueShift * 2 + 360) % 360
  const s = Math.max(10, Math.min(100, hsl.s + (rng() - 0.5) * satShift * 2))
  const l = Math.max(20, Math.min(80, hsl.l + (rng() - 0.5) * lightShift * 2))
  return hslToHex(h, s, l)
}

// --- Petal Path ---
function petalPath(length: number, width: number, curvature: number = 0.4): string {
  const c1x = width * curvature
  const c1y = -length * 0.35
  const c2x = width * 0.5
  const c2y = -length * 0.75
  return `M 0 0 C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, 0 ${-length.toFixed(1)} C ${(-c2x).toFixed(1)} ${c2y.toFixed(1)}, ${(-c1x).toFixed(1)} ${c1y.toFixed(1)}, 0 0`
}

// --- Gradient & Shadow Defs ---
function createDefs(id: number, baseColor: string, seed: number) {
  const hsl = hexToHSL(baseColor)
  const lighter = hslToHex(hsl.h, Math.max(0, hsl.s - 10), Math.min(95, hsl.l + 20))
  const darker = hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(15, hsl.l - 15))

  return (
    <defs key={id}>
      <linearGradient id={`${id}-petal`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={darker} />
        <stop offset="50%" stopColor={baseColor} />
        <stop offset="100%" stopColor={lighter} />
      </linearGradient>
      <radialGradient id={`${id}-center`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={lighter} />
        <stop offset="100%" stopColor={darker} />
      </radialGradient>
      <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.18" />
      </filter>
    </defs>
  )
}

// --- Family Generators ---

function generateRose(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const layerCount = simplified ? 2 : 3
  const layers = [
    { count: 7 + Math.floor(rng() * 3), len: 18 + rng() * 6, wid: 11 + rng() * 3, off: 0, op: 0.82 },
    { count: 5 + Math.floor(rng() * 2), len: 12 + rng() * 5, wid: 8 + rng() * 2, off: 0.18, op: 0.9 },
    { count: 4 + Math.floor(rng() * 2), len: 7 + rng() * 3, wid: 5 + rng() * 2, off: 0.32, op: 0.95 },
  ].slice(0, layerCount)

  layers.forEach((layer, li) => {
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 + layer.off + (rng() - 0.5) * 0.12
      const rot = (angle * 180) / Math.PI
      elements.push(
        <ellipse
          key={`r${li}-${i}`}
          cx={cx}
          cy={cy - layer.len / 2}
          rx={layer.wid / 2}
          ry={layer.len / 2}
          fill={`url(#${seed}-petal)`}
          opacity={layer.op}
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      )
    }
  })

  elements.push(
    <circle key="rc" cx={cx} cy={cy} r="4" fill={`url(#${seed}-center)`} filter={`url(#${seed}-shadow)`} />
  )
  return elements
}

function generateSunflower(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const centerR = 15 + rng() * 5
  elements.push(
    <circle key="sc" cx={cx} cy={cy} r={centerR} fill="#6B3A2A" filter={`url(#${seed}-shadow)`} />
  )

  const seedCount = simplified ? 15 : 28
  for (let i = 0; i < seedCount; i++) {
    const a = rng() * Math.PI * 2
    const d = rng() * (centerR - 3)
    elements.push(
      <circle key={`ss${i}`} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r="1.2" fill="#4A2518" />
    )
  }

  const petalCount = simplified ? 14 : 22 + Math.floor(rng() * 8)
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    const rot = (angle * 180) / Math.PI
    const len = 30 + rng() * 10
    const wid = 5 + rng() * 2
    elements.push(
      <ellipse
        key={`sp${i}`}
        cx={cx}
        cy={cy - len / 2}
        rx={wid / 2}
        ry={len / 2}
        fill={`url(#${seed}-petal)`}
        opacity="0.9"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    )
  }
  return elements
}

function generateTulip(rng: () => number, baseColor: string, seed: number, _simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  for (let i = 0; i < 3; i++) {
    const baseAngle = (i / 3) * Math.PI * 2
    const angle = baseAngle + (rng() - 0.5) * 0.25
    const len = 32 + rng() * 8
    const wid = 15 + rng() * 4

    const tipX = cx + Math.cos(angle) * len * 0.65
    const tipY = cy + Math.sin(angle) * len * 0.65 - 6

    const lx = cx + Math.cos(angle - 0.35) * wid
    const ly = cy + Math.sin(angle - 0.35) * wid - 2

    const rx = cx + Math.cos(angle + 0.35) * wid
    const ry = cy + Math.sin(angle + 0.35) * wid - 2

    const rot = (angle * 180) / Math.PI + 90

    elements.push(
      <path
        key={`tp${i}`}
        d={`M ${cx} ${cy} Q ${lx.toFixed(1)} ${ly.toFixed(1)}, ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${rx.toFixed(1)} ${ry.toFixed(1)}, ${cx} ${cy}`}
        fill={`url(#${seed}-petal)`}
        opacity="0.9"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    )
  }
  return elements
}

function generateLily(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const petalCount = simplified ? 4 : 6
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
    const rot = (angle * 180) / Math.PI
    const len = 30 + rng() * 8
    const wid = 8 + rng() * 3
    const recurve = 12 + rng() * 8

    elements.push(
      <g key={`lp${i}`} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
        <path d={petalPath(len, wid, 0.5)} fill={`url(#${seed}-petal)`} opacity="0.9" transform={`rotate(${recurve})`} />
      </g>
    )
  }

  if (!simplified && rng() > 0.3) {
    for (let i = 0; i < 5; i++) {
      const a = rng() * Math.PI * 2
      const d = 4 + rng() * 7
      elements.push(
        <circle key={`ls${i}`} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r="1.5" fill={hslToHex(50, 80, 30)} opacity="0.7" />
      )
    }
  }

  elements.push(
    <circle key="lc" cx={cx} cy={cy} r="3" fill={`url(#${seed}-center)`} />
  )
  return elements
}

function generateOrchid(rng: () => number, baseColor: string, seed: number, _simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const ll = 38 + rng() * 10
  const lw = 20 + rng() * 5
  elements.push(
    <g key="ol" transform={`translate(${cx}, ${cy}) rotate(180)`}>
      <path d={petalPath(ll, lw, 0.55)} fill={`url(#${seed}-petal)`} opacity="0.9" />
    </g>
  )

  const sideRots = [140, 220]
  sideRots.forEach((rot, i) => {
    const len = 22 + rng() * 6
    const wid = 9 + rng() * 3
    elements.push(
      <g key={`os${i}`} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
        <path d={petalPath(len, wid, 0.45)} fill={`url(#${seed}-petal)`} opacity="0.85" />
      </g>
    )
  })

  const topRots = [55, 305]
  topRots.forEach((rot, i) => {
    const len = 16 + rng() * 5
    const wid = 6 + rng() * 2
    elements.push(
      <g key={`ot${i}`} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
        <path d={petalPath(len, wid, 0.4)} fill={`url(#${seed}-petal)`} opacity="0.8" />
      </g>
    )
  })

  return elements
}

function generatePeony(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const layerCount = simplified ? 2 : 3
  const layers = [
    { count: 10, len: 26, wid: 13, off: 0, op: 0.7 },
    { count: 8, len: 20, wid: 10, off: 0.14, op: 0.8 },
    { count: 6, len: 14, wid: 7, off: 0.28, op: 0.9 },
  ].slice(0, layerCount)

  layers.forEach((layer, li) => {
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 + layer.off + (rng() - 0.5) * 0.08
      const rot = (angle * 180) / Math.PI
      const lenVar = layer.len + (rng() - 0.5) * 5
      const widVar = layer.wid + (rng() - 0.5) * 3
      elements.push(
        <ellipse
          key={`p${li}-${i}`}
          cx={cx}
          cy={cy - lenVar / 2}
          rx={widVar / 2}
          ry={lenVar / 2}
          fill={`url(#${seed}-petal)`}
          opacity={layer.op}
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      )
    }
  })

  elements.push(
    <circle key="pc" cx={cx} cy={cy} r="5" fill={`url(#${seed}-center)`} />
  )
  return elements
}

function generateDaisy(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  const centerR = 10 + rng() * 3
  elements.push(
    <circle key="dc" cx={cx} cy={cy} r={centerR} fill="#FFD700" filter={`url(#${seed}-shadow)`} />
  )

  const count = simplified ? 12 : 18 + Math.floor(rng() * 6)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const rot = (angle * 180) / Math.PI
    const len = 22 + rng() * 8
    const wid = 3.5 + rng() * 1.5
    elements.push(
      <ellipse
        key={`dp${i}`}
        cx={cx}
        cy={cy - len / 2}
        rx={wid / 2}
        ry={len / 2}
        fill={`url(#${seed}-petal)`}
        opacity="0.9"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    )
  }
  return elements
}

function generateLavender(rng: () => number, baseColor: string, seed: number, simplified: boolean): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const cx = 100, cy = 100

  elements.push(
    <line key="ls" x1={cx} y1={cy + 35} x2={cx} y2={cy - 25} stroke="#6B8E23" strokeWidth="2.5" strokeLinecap="round" />
  )

  const clusterCount = simplified ? 3 : 5 + Math.floor(rng() * 3)
  for (let c = 0; c < clusterCount; c++) {
    const clusterY = cy + 30 - c * 10
    const clusterX = cx + (rng() - 0.5) * 8
    const flowerCount = simplified ? 2 : 3 + Math.floor(rng() * 3)

    for (let f = 0; f < flowerCount; f++) {
      const a = (f / flowerCount) * Math.PI * 2 + rng() * 0.5
      const d = 2 + rng() * 3
      const fx = clusterX + Math.cos(a) * d
      const fy = clusterY + Math.sin(a) * d * 0.4

      elements.push(
        <g key={`lv${c}-${f}`}>
          <circle cx={fx} cy={fy} r="2.5" fill={`url(#${seed}-petal)`} opacity="0.9" />
          <circle cx={fx} cy={fy} r="1" fill="#DDA0DD" />
        </g>
      )
    }
  }
  return elements
}

const GENERATORS: Record<FlowerType, (rng: () => number, baseColor: string, seed: number, simplified: boolean) => React.ReactNode[]> = {
  rose: generateRose,
  sunflower: generateSunflower,
  tulip: generateTulip,
  lily: generateLily,
  orchid: generateOrchid,
  peony: generatePeony,
  daisy: generateDaisy,
  lavender: generateLavender,
}

interface ProceduralFlowerProps {
  type: FlowerType
  color: string
  seed: number
  size?: number
  className?: string
  simplified?: boolean
}

export const ProceduralFlower = memo(function ProceduralFlower({
  type,
  color,
  seed,
  size = 100,
  className = '',
  simplified = false,
}: ProceduralFlowerProps) {
  const svgContent = useMemo(() => {
    const localRng = createRng(seed)
    const generator = GENERATORS[type]
    if (!generator) return null
    return generator(localRng, color, seed, simplified)
  }, [type, color, seed, simplified])

  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -15, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
    >
      {createDefs(seed, color, seed)}
      {svgContent}
    </motion.svg>
  )
})

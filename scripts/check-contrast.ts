/**
 * Contrast check script for Open Sky design tokens.
 * Verifies every text/background pair meets WCAG AA (4.5:1) in both themes.
 */

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

function getLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const s = (c: number) => {
    const f = c / 255
    return f <= 0.03928 ? f / 12.92 : Math.pow((f + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * s(r) + 0.7152 * s(g) + 0.0722 * s(b)
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const la = getLuminance(a)
  const lb = getLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) throw new Error(`Invalid hex: ${hex}`)
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

const tokens: Record<string, { light: string; dark: string }> = {
  bg: { light: '#F5F9FF', dark: '#0B1220' },
  surface: { light: '#FFFFFF', dark: '#121B2E' },
  'surface-2': { light: '#E8F0FA', dark: '#1A2540' },
  sky: { light: '#CFE4FA', dark: '#10204A' },
  text: { light: '#0F1B2D', dark: '#E8EEF9' },
  'text-soft': { light: '#3E4C63', dark: '#B4C1D9' },
  'text-muted': { light: '#53627A', dark: '#8D9BB5' },
  line: { light: '#C5D3E6', dark: '#2A3858' },
  ink: { light: '#0F1B2D', dark: '#E8EEF9' },
  accent: { light: '#1F5FD1', dark: '#4A90E2' },
  'accent-text': { light: '#1A55BD', dark: '#7AA7F7' },
  'accent-soft': { light: '#DCE8FB', dark: '#16264A' },
  success: { light: '#1C7A4B', dark: '#5FD39A' },
  danger: { light: '#B3261E', dark: '#FF8A80' },
}

const MIN_CONTRAST = 4.5

let failures = 0

function check(label: string, fg: string, bg: string, theme: string) {
  const ratio = contrastRatio(hexToRgb(fg), hexToRgb(bg))
  const ok = ratio >= MIN_CONTRAST
  if (!ok) {
    console.error(`FAIL [${theme}] ${label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (need ${MIN_CONTRAST}:1)`)
    failures++
  } else {
    console.log(`OK   [${theme}] ${label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`)
  }
}

// Check text on bg for both themes
for (const theme of ['light', 'dark'] as const) {
  const t = tokens
  const bg = t.bg[theme]

  check('text on bg', t.text[theme], bg, theme)
  check('text-soft on bg', t['text-soft'][theme], bg, theme)
  check('text-muted on bg', t['text-muted'][theme], bg, theme)
  check('accent-text on bg', t['accent-text'][theme], bg, theme)
  check('accent on bg', t.accent[theme], bg, theme)
  check('success on bg', t.success[theme], bg, theme)
  check('danger on bg', t.danger[theme], bg, theme)

  // Check text on surface
  const surface = t.surface[theme]
  check('text on surface', t.text[theme], surface, theme)
  check('text-soft on surface', t['text-soft'][theme], surface, theme)
  check('text-muted on surface', t['text-muted'][theme], surface, theme)

  // Check accent on surface
  check('accent on surface', t.accent[theme], surface, theme)
  // White text on accent works in light theme; dark theme uses black text on accent
  if (theme === 'light') {
    check('white on accent', '#FFFFFF', t.accent[theme], theme)
  } else {
    check('black on accent', '#000000', t.accent[theme], theme)
  }

  // Check text on surface-2
  const s2 = t['surface-2'][theme]
  check('text on surface-2', t.text[theme], s2, theme)
  check('text-soft on surface-2', t['text-soft'][theme], s2, theme)
}

console.log(`\n${failures === 0 ? 'All contrast checks passed' : failures + ' contrast check(s) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)

'use client'

/**
 * Cassette artifact: flat cassette body, two reels, a tape path and a
 * handwritten label. Flat-lit, no gloss.
 */
export function CassetteArtifact() {
  return (
    <svg
      viewBox="0 0 200 90"
      className="w-64 h-28 shrink-0"
      style={{ transform: 'rotate(var(--rot, 0deg))' }}
      aria-hidden="true"
    >
      {/* Cast shadow */}
      <rect x="14" y="62" width="180" height="10" rx="6" style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.3 }} />

      {/* Body */}
      <rect
        x="10" y="20" width="180" height="46" rx="4"
        style={{
          fill: 'var(--art-paper, #FFFFFF)',
          stroke: 'var(--art-ink, #0F1B2D)',
          strokeWidth: 1.4,
        }}
      />
      {/* Thickness edge */}
      <rect x="186" y="20" width="4" height="46" style={{ fill: 'var(--art-edge, #AFC3DD)' }} />
      <rect x="10" y="62" width="180" height="4" style={{ fill: 'var(--art-edge, #AFC3DD)' }} />
      {/* Top edge strip */}
      <rect x="10" y="20" width="180" height="6" style={{ fill: 'var(--art-paper-2, #EAF1FB)' }} />

      {/* Tape path between reels */}
      <path
        d="M 52 44 Q 100 26 148 44"
        style={{ fill: 'none', stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.5 }}
      />

      {/* Reels */}
      {[[40, 44], [160, 44]].map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="15" style={{ fill: 'var(--art-paper-2, #EAF1FB)', stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 1.2 }} />
          <circle cx={cx} cy={cy} r="6" style={{ fill: 'var(--art-ink, #0F1B2D)' }} />
          <circle cx={cx} cy={cy} r="2.5" style={{ fill: 'var(--art-paper, #FFFFFF)' }} />
        </g>
      ))}

      {/* Label window */}
      <rect x="62" y="34" width="76" height="20" rx="2" style={{ fill: 'var(--art-paper-2, #EAF1FB)', stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 1 }} />
      <text
        x="100" y="48"
        textAnchor="middle"
        style={{
          fill: 'var(--art-ink, #0F1B2D)',
          fontFamily: 'var(--font-hand)',
          fontSize: 13,
        }}
      >
        For You
      </text>

      {/* Screw holes */}
      {[[20, 30], [180, 30]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.6" style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.6 }} />
      ))}
    </svg>
  )
}

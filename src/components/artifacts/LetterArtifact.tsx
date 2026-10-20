'use client'

/**
 * Love letter artifact: folded cream paper with ruled lines, a fold line,
 * deckled edges and a raised wax seal with pressed monogram.
 */
export function LetterArtifact() {
  return (
    <svg
      viewBox="0 0 200 140"
      className="w-64 h-44 shrink-0"
      style={{ transform: 'rotate(var(--rot, 0deg))' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="letter-deckle" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Drop shadow under the letter */}
      <rect
        x="10" y="10" width="188" height="128" rx="2"
        style={{ fill: 'var(--art-ink)', opacity: 0.25 }}
      />

      {/* Paper body */}
      <rect
        x="6" y="6" width="188" height="128" rx="2"
        style={{
          fill: 'var(--art-paper, #FFFFFF)',
          stroke: 'var(--art-ink, #0F1B2D)',
          strokeWidth: 1,
        }}
        filter="url(#letter-deckle)"
      />

      {/* Fold line across the middle */}
      <line
        x1="6" y1="74" x2="194" y2="74"
        style={{ stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 1, opacity: 0.45 }}
      />

      {/* Ruled lines */}
      {[18, 30, 92, 112].map((y) => (
        <line
          key={y}
          x1="14" y1={y} x2="186" y2={y}
          style={{ stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 0.75, opacity: 0.4 }}
        />
      ))}

      {/* Wax seal — raised, irregular edge, highlight, pressed monogram */}
      <g style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.35))' }}>
        <circle
          cx="36" cy="102" r="15"
          style={{ fill: 'var(--art-red, #C0392B)', stroke: 'rgba(0,0,0,0.4)', strokeWidth: 1.5 }}
        />
        {/* Highlight top-left */}
        <circle
          cx="33" cy="99" r="10"
          style={{ fill: 'rgba(255,255,255,0.3)' }}
        />
        {/* Pressed monogram */}
        <text
          x="36" y="106"
          textAnchor="middle"
          style={{
            fill: 'var(--art-paper, #FFFFFF)',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.05,
            dominantBaseline: 'central',
          }}
        >
          K
        </text>
      </g>
    </svg>
  )
}

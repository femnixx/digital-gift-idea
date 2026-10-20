'use client'

/**
 * Parcel artifact: wrapped box in kraft paper with visible thickness, a
 * woven ribbon, a bow, and a swaying gift tag on a string.
 */
export function ParcelArtifact() {
  return (
    <svg
      viewBox="0 0 200 140"
      className="w-64 h-48 shrink-0"
      style={{ transform: 'rotate(var(--rot, 0deg))' }}
      aria-hidden="true"
    >
      <defs>
        {/* Woven ribbon texture: alternating dark/light stripes */}
        <linearGradient
          id="weave"
          x1="0" y1="0" x2="100%" y2="0"
        >
          <stop offset="0%" stopColor="var(--art-blue, #1F5FD1)" />
          <stop offset="50%" stopColor="#173F8F" />
          <stop offset="100%" stopColor="var(--art-blue, #1F5FD1)" />
        </linearGradient>
      </defs>

      {/* Cast shadow under the parcel */}
      <rect
        x="34" y="118" width="140" height="10" rx="6"
        style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.3 }}
      />

      {/* Box body */}
      <rect
        x="30" y="46" width="140" height="80" rx="3"
        style={{
          fill: 'var(--art-paper-2, #EAF1FB)',
          stroke: 'var(--art-ink, #0F1B2D)',
          strokeWidth: 1.4,
        }}
      />
      {/* Box thickness edge (right + bottom) */}
      <rect x="166" y="46" width="4" height="80" style={{ fill: 'var(--art-edge, #AFC3DD)' }} />
      <rect x="30" y="122" width="140" height="4" style={{ fill: 'var(--art-edge, #AFC3DD)' }} />

      {/* Lid line */}
      <rect
        x="30" y="46" width="140" height="16" rx="3"
        style={{
          fill: 'var(--art-paper, #FFFFFF)',
          stroke: 'var(--art-ink, #0F1B2D)',
          strokeWidth: 1.4,
        }}
      />

      {/* Vertical ribbon (woven) */}
      <rect
        x="96" y="46" width="8" height="80"
        style={{ fill: 'url(#weave)' }}
      />
      {/* Horizontal ribbon */}
      <rect
        x="30" y="80" width="140" height="8"
        style={{ fill: 'url(#weave)' }}
      />

      {/* Bow knot */}
      <circle
        cx="100" cy="84" r="7"
        style={{ fill: 'var(--art-blue, #1F5FD1)', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 1 }}
      />
      {/* Bow loops */}
      <ellipse cx="86" cy="70" rx="14" ry="10" style={{ fill: 'var(--art-blue, #1F5FD1)' }} transform="rotate(-25 86 70)" />
      <ellipse cx="114" cy="70" rx="14" ry="10" style={{ fill: 'var(--art-blue, #1F5FD1)' }} transform="rotate(25 114 70)" />
      <ellipse cx="86" cy="98" rx="12" ry="9" style={{ fill: 'var(--art-blue, #1F5FD1)', opacity: 0.85 }} transform="rotate(20 86 98)" />
      <ellipse cx="114" cy="98" rx="12" ry="9" style={{ fill: 'var(--art-blue, #1F5FD1)', opacity: 0.85 }} transform="rotate(-20 114 98)" />

      {/* Tag string */}
      <line
        x1="100" y1="54" x2="100" y2="44"
        style={{ stroke: 'var(--art-ink, #0F1B2D)', strokeWidth: 1.2, opacity: 0.7 }}
      />
      {/* Gift tag */}
      <rect
        x="90" y="30" width="20" height="14" rx="2"
        style={{
          fill: 'var(--art-paper, #FFFFFF)',
          stroke: 'var(--art-ink, #0F1B2D)',
          strokeWidth: 1,
        }}
      />
      <circle cx="100" cy="30" r="1.6" style={{ fill: 'var(--art-ink, #0F1B2D)' }} />
      <text
        x="100" y="40"
        textAnchor="middle"
        style={{
          fill: 'var(--art-ink, #0F1B2D)',
          fontFamily: 'var(--font-hand)',
          fontSize: 10,
        }}
      >
        You
      </text>
    </svg>
  )
}

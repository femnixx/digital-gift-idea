'use client'

/**
 * Coupon booklet artifact: a stack of three tear-off tickets with perforated
 * left edge, semicircle notches, "ADMIT ONE" lettering and a rubber "REDEEMED"
 * stamp on the top ticket.
 */
export function CouponArtifact() {
  const tickets = [
    { x: 10, y: 4, stamp: true },
    { x: 16, y: 10, stamp: false },
    { x: 22, y: 16, stamp: false },
  ]

  return (
    <svg
      viewBox="0 0 200 110"
      className="w-64 h-36 shrink-0"
      style={{ transform: 'rotate(var(--rot, 0deg))' }}
      aria-hidden="true"
    >
      <defs>
        {/* Perforation dot pattern reused across tickets */}
        <pattern
          id="perf"
          x="0"
          y="0"
          width="4"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0" cy="0" r="1.4" style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.5 }} />
          <circle cx="0" cy="10" r="1.4" style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.5 }} />
        </pattern>
      </defs>

      {tickets.map((t, i) => (
        <g key={i}>
          {/* Drop shadow */}
          <rect
            x={t.x + 2} y={t.y + 2} width="148" height="30" rx="2"
            style={{ fill: 'var(--art-ink, #0F1B2D)', opacity: 0.25 }}
          />
          {/* Ticket body with notch mask at bottom-left */}
          <rect
            x={t.x} y={t.y} width="148" height="30" rx="2"
            style={{
              fill: 'var(--art-paper, #FFFFFF)',
              stroke: 'var(--art-ink, #0F1B2D)',
              strokeWidth: 1,
            }}
            mask={`url(#notch-${i})`}
          />
          <mask id={`notch-${i}`} x={t.x} y={t.y} width="148" height="30" maskUnits="userSpaceOnUse">
            <rect width="148" height="30" fill="white" />
            <circle cx={t.x} cy={t.y + 30} r="7" fill="black" />
          </mask>
          {/* Perforated left edge */}
          <rect
            x={t.x} y={t.y} width="4" height="30"
            style={{ fill: 'url(#perf)' }}
          />
          {/* ADMIT ONE text */}
          <text
            x={t.x + 70} y={t.y + 17}
            textAnchor="middle"
            style={{
              fill: 'var(--art-ink-soft, #53627A)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.16,
              textTransform: 'uppercase',
            }}
          >
            ADMIT ONE
          </text>
          {/* Rubber stamp on top ticket */}
          {t.stamp && (
            <g style={{ transformOrigin: `${t.x + 115}px ${t.y + 24}px` }}>
              <rect
                x={t.x + 88} y={t.y + 10} width="44" height="22" rx="2"
                style={{
                  fill: 'none',
                  stroke: 'var(--art-red, #C0392B)',
                  strokeWidth: 1.6,
                  opacity: 0.7,
                }}
                transform="rotate(-12)"
              />
              <text
                x={t.x + 110} y={t.y + 25}
                textAnchor="middle"
                style={{
                  fill: 'var(--art-red, #C0392B)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 0.1,
                  textTransform: 'uppercase',
                  opacity: 0.8,
                }}
                transform="rotate(-12)"
              >
                REDEEMED
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}

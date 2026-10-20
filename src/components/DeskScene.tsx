'use client'

import { LetterArtifact } from '@/components/artifacts/LetterArtifact'
import { CouponArtifact } from '@/components/artifacts/CouponArtifact'
import { ParcelArtifact } from '@/components/artifacts/ParcelArtifact'
import { CassetteArtifact } from '@/components/artifacts/CassetteArtifact'

const items = [
  {
    id: 'letter',
    Artifact: LetterArtifact,
    label: 'Love letter',
    note: 'A handwritten note, sealed.',
    rot: -3,
    area: 'a',
  },
  {
    id: 'coupons',
    Artifact: CouponArtifact,
    label: 'Coupon booklet',
    note: 'Tear-off vouchers to redeem.',
    rot: 2,
    area: 'b',
  },
  {
    id: 'parcel',
    Artifact: ParcelArtifact,
    label: 'Wrapped gift',
    note: 'Tied with ribbon and wax.',
    rot: -1.5,
    area: 'c',
  },
  {
    id: 'tape',
    Artifact: CassetteArtifact,
    label: 'Mixtape',
    note: 'A cassette of songs for them.',
    rot: 3,
    area: 'd',
  },
]

export function DeskScene() {
  return (
    <section
      aria-label="Gift types"
      className="grain table-surface mx-auto max-w-6xl px-5 py-14 rounded-[6px]"
    >
      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 items-start">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex flex-col items-center"
            style={{
              '--rot': `${it.rot}deg`,
              // Slight negative offsets so objects overlap like a real desk pile.
              marginTop:
                it.id === 'coupons' || it.id === 'tape' ? '-10%' : '-4%',
              marginLeft: it.id === 'tape' ? '-3%' : 0,
            } as React.CSSProperties}
          >
            <div
              className="obj obj-lift"
              style={{ transform: `rotate(${it.rot}deg)` }}
            >
              <it.Artifact />
            </div>
            {/* Paper tag: label always attached to its object, never spills off */}
            <div className="paper-tag mt-5 px-4 py-2 text-center max-w-[16rem]">
              <div className="font-display font-semibold text-lg">{it.label}</div>
              <div className="font-ui text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                {it.note}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

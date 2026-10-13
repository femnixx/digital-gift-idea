'use client'

import { useState } from 'react'
import { Clock, Infinity as InfinityIcon, CalendarClock } from 'lucide-react'
import { TTL_PRESETS } from '@/lib/api/ttl'

/**
 * Optional lifetime for a gift, chosen before publishing.
 *
 * Permanence is the default because that is the safer assumption: a gift that
 * disappears unexpectedly is worse than one that lingers. Setting a lifetime is
 * a deliberate act, and the input is bounded by the same 30-day ceiling the API
 * enforces, so the control cannot offer a date the server will refuse.
 */

export interface TtlPickerProps {
  /** Required: current choice, null meaning permanent. */
  value: string | null
  /** Required: receives the new choice, or null for permanent. */
  onChange: (value: string | null) => void
  /** Optional: the cap, in days. Defaults to 30. */
  maxDays?: number
  /** Optional: the max attribute for the date input, precomputed as an ISO string. */
  max?: string
}

function isoAfterDays(days: number): string {
  const at = new Date()
  at.setDate(at.getDate() + days)
  at.setHours(23, 59, 59, 999)
  return at.toISOString()
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function describe(value: string | null): string {
  if (!value) return 'This gift is permanent and will not expire.'
  const ms = new Date(value).getTime() - Date.now()
  if (ms <= 0) return 'This gift has already expired.'
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000))
  const when = new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  return `Expires in ${days} day${days === 1 ? '' : 's'} on ${when}.`
}

export function TtlPicker({ value, onChange, maxDays = 30, max }: TtlPickerProps) {
  const [custom, setCustom] = useState(false)

  return (
    <div className="card card-lg space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <CalendarClock className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0">
          <h2 className="subheading">How long should it last?</h2>
          <p className="text-sm muted-foreground">
            Optional. Leave it permanent, or have it delete itself automatically.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null && !custom}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            value === null && !custom
              ? 'border-brand bg-brand/10 text-body'
              : 'border-line text-body-muted hover:border-brand/50'
          }`}
        >
          <InfinityIcon className="w-4 h-4" />
          Permanent
        </button>

        {TTL_PRESETS.filter((days) => days <= maxDays).map((days) => {
          const iso = isoAfterDays(days)
          const active = value === iso && !custom
          return (
            <button
              key={days}
              type="button"
              onClick={() => onChange(iso)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active ? 'border-brand bg-brand/10 text-body' : 'border-line text-body-muted hover:border-brand/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              {days} day{days === 1 ? '' : 's'}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => {
            setCustom(true)
            if (!value) onChange(isoAfterDays(1))
          }}
          aria-pressed={custom}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            custom ? 'border-brand bg-brand/10 text-body' : 'border-line text-body-muted hover:border-brand/50'
          }`}
        >
          Custom
        </button>
      </div>

      {custom ? (
        <div className="space-y-2">
          <label htmlFor="ttl-date" className="label">
            Expiry date
          </label>
          <input
            id="ttl-date"
            type="date"
            className="input"
            value={toDateInputValue(value)}
            max={max ? toDateInputValue(max) : undefined}
            min={toDateInputValue(new Date().toISOString())}
            onChange={(e) => {
              const picked = e.target.value
              if (!picked) {
                onChange(null)
                return
              }
              const at = new Date(`${picked}T23:59:59`)
              onChange(Number.isNaN(at.getTime()) ? null : at.toISOString())
            }}
          />
          <p className="hint">Up to {maxDays} days from today.</p>
        </div>
      ) : null}

      <p className="text-sm text-body-muted flex items-start gap-2">
        <Clock className="w-4 h-4 mt-0.5 shrink-0" />
        {describe(value)}
      </p>
    </div>
  )
}

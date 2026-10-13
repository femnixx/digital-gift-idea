/**
 * Gift lifetime rules.
 *
 * A gift may be given an expiry, but it is optional (null means permanent) and
 * capped so a mistyped date cannot silently create a gift that outlives its
 * usefulness, or one that expires the instant it is shared.
 */

export const MAX_TTL_DAYS = 30
export const MAX_TTL_MS = MAX_TTL_DAYS * 24 * 60 * 60 * 1000

/** Quick presets offered in the publish UI, in days. */
export const TTL_PRESETS = [1, 7, 30] as const

export interface TtlResult {
  ok: boolean
  error?: string
  /** Milliseconds from now, for countdown copy in the UI. */
  ms?: number
}

/**
 * Validates a requested expiry.
 *
 * Accepts null or undefined, meaning permanent. Otherwise the value must be a
 * real timestamp, in the future, and no more than 30 days out.
 */
export function validateTtl(value: string | null | undefined): TtlResult {
  if (value === null || value === undefined || value === '') {
    return { ok: true, ms: 0 }
  }

  const at = new Date(value)
  if (Number.isNaN(at.getTime())) {
    return { ok: false, error: 'Expiry must be a valid date' }
  }

  const now = Date.now()
  if (at.getTime() <= now) {
    return { ok: false, error: 'Expiry must be in the future' }
  }

  const ms = at.getTime() - now
  if (ms > MAX_TTL_MS) {
    return { ok: false, error: `Expiry cannot be more than ${MAX_TTL_DAYS} days away` }
  }

  return { ok: true, ms }
}

/** The latest expiry a caller may request, for clamping a date picker's max. */
export function maxExpiryIso(): string {
  return new Date(Date.now() + MAX_TTL_MS).toISOString()
}

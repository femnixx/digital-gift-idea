import { NextResponse, type NextRequest } from 'next/server'

interface RateLimitBucket {
  failures: number
  blockedUntil: number
}

const buckets = new Map<string, RateLimitBucket>()

const WINDOW_MS = 60 * 1000
const MAX_ATTEMPTS = 5

// Opportunistic cleanup so the in-memory map cannot grow without bound.
let lastSweep = Date.now()
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.blockedUntil <= now) buckets.delete(key)
  }
}

function clientKey(request: NextRequest, action: string): string {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  return `${action}:${ip}`
}

/**
 * In-memory failure counter for sensitive endpoints such as admin login.
 *
 * Only failed attempts are counted and a successful attempt clears the counter,
 * so a legitimate caller is never penalised for signing in successfully. Returns
 * a 429 response once a caller exceeds the budget, otherwise null.
 */
export function recordFailedAttempt(
  request: NextRequest,
  action: string,
  maxAttempts = MAX_ATTEMPTS,
  windowMs = WINDOW_MS
): NextResponse | null {
  const now = Date.now()
  sweep(now)

  const key = clientKey(request, action)
  const bucket = buckets.get(key) || { failures: 0, blockedUntil: 0 }

  if (bucket.blockedUntil > now) {
    const retryAfter = Math.ceil((bucket.blockedUntil - now) / 1000)
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment before trying again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  bucket.failures += 1
  if (bucket.failures >= maxAttempts) {
    bucket.blockedUntil = now + windowMs
    buckets.set(key, bucket)
    const retryAfter = Math.ceil(windowMs / 1000)
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment before trying again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  buckets.set(key, bucket)
  return null
}

/** Clear a caller's failure counter after a successful attempt. */
export function clearFailedAttempts(request: NextRequest, action: string): void {
  buckets.delete(clientKey(request, action))
}

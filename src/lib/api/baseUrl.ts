import type { NextRequest } from 'next/server'

/**
 * Absolute base URL for building shareable links.
 *
 * Prefers the request's own origin so a preview deployment links to itself, and
 * falls back to the configured public URL for environments where the request
 * host is not the public one.
 */
export function resolveBaseUrl(request?: NextRequest): string {
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    if (host) return `${proto}://${host}`
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/$/, '')
  }

  return 'http://localhost:3001'
}

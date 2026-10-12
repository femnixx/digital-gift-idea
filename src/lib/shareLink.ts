/**
 * Client-side origin resolver for building shareable links in the browser.
 * The server has its own equivalent in lib/api/baseUrl.ts.
 */
export function resolveBaseUrlLocal(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
}

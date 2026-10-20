/* ============================================================================
   Keepsake slug utilities
   ============================================================================ */

import { RESERVED_SLUGS } from '@/types/keepsake'

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Generate a long random slug hard to guess (e.g. x7k2-m9qa-p3n8). */
export function generateSlug(length = 12): string {
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += SLUG_CHARS.charAt(Math.floor(Math.random() * SLUG_CHARS.length))
    if (i > 0 && i % 4 === 3 && i < length - 1) slug += '-'
  }
  return slug
}

/** Sanitize a custom slug: lowercase alphanumerics + hyphens only. */
export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** Check reserved words. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase())
}

/** Validate slug format. */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 40
}

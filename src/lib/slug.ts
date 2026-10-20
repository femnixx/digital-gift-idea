export const RESERVED_SLUGS = new Set([
  'admin','api','login','logout','signup','signin','dashboard',
  'g','gift','gifts','drawer','reply','publish','unpublish',
  'settings','account','profile','about','contact','privacy',
  'terms','sitemap','robots','favicon','opengraph','og',
  'report','delete','auth','session','checkout','stripe',
  'health','status','widget','embed','assets','static',
  'images','fonts','graphql','rest','webhook',
])

export function cleanSlug(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const cleaned = cleanSlug(slug)
  if (!cleaned) return { valid: false, error: 'empty' }
  if (cleaned.length < 2) return { valid: false, error: 'too_short' }
  if (cleaned.length > 60) return { valid: false, error: 'too_long' }
  if (!/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(cleaned)) {
    return { valid: false, error: 'format' }
  }
  if (RESERVED_SLUGS.has(cleaned)) return { valid: false, error: 'reserved' }
  return { valid: true }
}

export function slugFormatRegex(): RegExp {
  return /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/
}

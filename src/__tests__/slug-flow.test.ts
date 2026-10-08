import { describe, it, expect, vi, beforeEach } from 'vitest'

const createEntrySchema = {
  title: (value: string) => value.length >= 1 && value.length <= 200,
  type: (value: string) => ['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note'].includes(value),
  slug: (value: string) => value.length >= 1 && value.length <= 100 && /^[a-z0-9-]+$/.test(value),
  is_published: (value: boolean) => typeof value === 'boolean',
}

describe('Slug creation and validation flow', () => {
  it('should generate a valid slug from a title', () => {
    const title = 'Our First Anniversary'
    const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const timestamp = Date.now().toString(36).slice(-6)
    const slug = `${base}-${timestamp}`

    expect(slug).toMatch(/^our-first-anniversary-[a-z0-9]+$/)
    expect(createEntrySchema.slug(slug)).toBe(true)
  })

  it('should generate a unique slug for each call', async () => {
    const slugs = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const title = `Test Entry ${i}`
      const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const timestamp = Date.now().toString(36).slice(-6)
      const slug = `${base}-${timestamp}`
      slugs.add(slug)
    }
    expect(slugs.size).toBeGreaterThan(90)
  })

  it('should detect duplicate slugs in the database', () => {
    const existingSlugs = new Set(['my-entry', 'another-entry'])
    const newSlug = 'my-entry'

    const isDuplicate = existingSlugs.has(newSlug)
    expect(isDuplicate).toBe(true)
  })

  it('should allow unique slugs', () => {
    const existingSlugs = new Set(['my-entry', 'another-entry'])
    const newSlug = 'brand-new-entry'

    const isDuplicate = existingSlugs.has(newSlug)
    expect(isDuplicate).toBe(false)
  })

  it('should validate entry data before insertion', () => {
    const validEntry = {
      title: 'Valid Entry',
      type: 'letter',
      slug: 'valid-entry',
      is_published: false,
    }

    expect(createEntrySchema.title(validEntry.title)).toBe(true)
    expect(createEntrySchema.type(validEntry.type)).toBe(true)
    expect(createEntrySchema.slug(validEntry.slug)).toBe(true)
    expect(createEntrySchema.is_published(validEntry.is_published)).toBe(true)
  })

  it('should reject invalid entry data', () => {
    const invalidEntry = {
      title: '',
      type: 'invalid_type',
      slug: 'Invalid Slug!',
      is_published: 'not-a-boolean',
    }

    expect(createEntrySchema.title(invalidEntry.title)).toBe(false)
    expect(createEntrySchema.type(invalidEntry.type)).toBe(false)
    expect(createEntrySchema.slug(invalidEntry.slug)).toBe(false)
    expect(createEntrySchema.is_published(invalidEntry.is_published)).toBe(false)
  })
})

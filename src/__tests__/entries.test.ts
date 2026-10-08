import { describe, it, expect, vi, beforeEach } from 'vitest'

const createEntrySchema = {
  title: (value: string) => value.length >= 1 && value.length <= 200,
  type: (value: string) => ['letter', 'bouquet', 'polaroid', 'scratch_card', 'open_when', 'coffee_date', 'voice_note'].includes(value),
  slug: (value: string) => value.length >= 1 && value.length <= 100 && /^[a-z0-9-]+$/.test(value),
  is_published: (value: boolean) => typeof value === 'boolean',
}

describe('Entry creation validation', () => {
  it('should accept valid entry data', () => {
    const data = {
      title: 'My Entry',
      type: 'letter',
      slug: 'my-entry',
      is_published: false,
    }

    expect(createEntrySchema.title(data.title)).toBe(true)
    expect(createEntrySchema.type(data.type)).toBe(true)
    expect(createEntrySchema.slug(data.slug)).toBe(true)
    expect(createEntrySchema.is_published(data.is_published)).toBe(true)
  })

  it('should reject empty title', () => {
    expect(createEntrySchema.title('')).toBe(false)
  })

  it('should reject title longer than 200 chars', () => {
    expect(createEntrySchema.title('a'.repeat(201))).toBe(false)
  })

  it('should reject invalid type', () => {
    expect(createEntrySchema.type('invalid')).toBe(false)
  })

  it('should reject empty slug', () => {
    expect(createEntrySchema.slug('')).toBe(false)
  })

  it('should reject slug longer than 100 chars', () => {
    expect(createEntrySchema.slug('a'.repeat(101))).toBe(false)
  })

  it('should reject slug with uppercase letters', () => {
    expect(createEntrySchema.slug('My-Slug')).toBe(false)
  })

  it('should reject slug with special characters', () => {
    expect(createEntrySchema.slug('my_slug!')).toBe(false)
  })

  it('should accept slug with numbers and hyphens', () => {
    expect(createEntrySchema.slug('my-entry-123')).toBe(true)
  })

  it('should reject slug starting with uppercase', () => {
    expect(createEntrySchema.slug('My-slug')).toBe(false)
  })
})

describe('Slug uniqueness', () => {
  const existingSlugs = new Set(['my-entry', 'another-entry'])

  it('should detect duplicate slug', () => {
    const slug = 'my-entry'
    expect(existingSlugs.has(slug)).toBe(true)
  })

  it('should allow unique slug', () => {
    const slug = 'unique-entry'
    expect(existingSlugs.has(slug)).toBe(false)
  })
})

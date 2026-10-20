import { describe, it, expect } from 'vitest'
import { cleanSlug, validateSlug, RESERVED_SLUGS, slugFormatRegex } from '@/lib/slug'

describe('slug validation', () => {
  it('cleans a slug', () => {
    expect(cleanSlug('My Gift!')).toBe('my-gift')
    expect(cleanSlug('  Hello World  ')).toBe('hello-world')
    expect(cleanSlug('---triple---dash---')).toBe('triple-dash')
  })

  it('accepts valid slugs', () => {
    expect(validateSlug('my-gift').valid).toBe(true)
    expect(validateSlug('a-b').valid).toBe(true)
    expect(validateSlug('a').valid).toBe(false) // too short
    expect(validateSlug('our-first-year-2024').valid).toBe(true)
  })

  it('rejects reserved slugs', () => {
    expect(RESERVED_SLUGS.has('admin')).toBe(true)
    expect(RESERVED_SLUGS.has('api')).toBe(true)
    expect(RESERVED_SLUGS.has('g')).toBe(true)
    expect(RESERVED_SLUGS.has('gifts')).toBe(true)
    expect(validateSlug('admin').valid).toBe(false)
    expect(validateSlug('api').valid).toBe(false)
  })

  it('rejects invalid formats', () => {
    expect(validateSlug('-leading').valid).toBe(true) // cleaned to 'leading'
    expect(validateSlug('trailing-').valid).toBe(true) // cleaned to 'trailing'
    expect(validateSlug('a'.repeat(61)).valid).toBe(false) // too long
    expect(validateSlug('admin').valid).toBe(false) // reserved
    expect(validateSlug('api').valid).toBe(false) // reserved
    expect(validateSlug('').valid).toBe(false) // empty
  })

  it('matches the database CHECK constraint regex', () => {
    expect(slugFormatRegex().test('my-gift')).toBe(true)
    expect(slugFormatRegex().test('a')).toBe(false)
    expect(slugFormatRegex().test('a-b')).toBe(true)
    expect(slugFormatRegex().test('-bad')).toBe(false)
    expect(slugFormatRegex().test('bad-')).toBe(false)
  })
})

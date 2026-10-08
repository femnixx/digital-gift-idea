import { describe, it, expect } from 'vitest'

function generateSlug(title: string, isDemo: boolean): string {
  if (isDemo) {
    return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
  }
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const timestamp = Date.now().toString(36).slice(-6)
  return `${base}-${timestamp}`
}

describe('generateSlug', () => {
  it('should generate a temp slug when isDemo is true', () => {
    const slug = generateSlug('My Title', true)
    expect(slug).toMatch(/^tmp-[a-z0-9]+-[a-z0-9]+$/)
  })

  it('should generate a real slug when isDemo is false', () => {
    const slug = generateSlug('My First Anniversary', false)
    expect(slug).toMatch(/^my-first-anniversary-[a-z0-9]+$/)
  })

  it('should handle special characters', () => {
    const slug = generateSlug('Hello World!!!', false)
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/)
  })

  it('should handle empty title', () => {
    const slug = generateSlug('', false)
    expect(slug).toMatch(/^-[a-z0-9]+$/)
  })

  it('should handle multiple spaces', () => {
    const slug = generateSlug('My   Test   Title', false)
    expect(slug).toMatch(/^my-test-title-[a-z0-9]+$/)
  })

  it('should handle numbers', () => {
    const slug = generateSlug('Entry 123', false)
    expect(slug).toMatch(/^entry-123-[a-z0-9]+$/)
  })

  it('should not start or end with hyphens', () => {
    const slug = generateSlug('  Test  ', false)
    expect(slug).not.toMatch(/^-/)
    expect(slug).not.toMatch(/-$/)
  })
})

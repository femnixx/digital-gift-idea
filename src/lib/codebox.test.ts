import { describe, it, expect } from 'vitest'

describe('CodeBox close detection', () => {
  it('detects close match at edit distance 1', () => {
    // Simple edit distance check
    const editDistance = (a: string, b: string): number => {
      const dp: number[][] = []
      for (let i = 0; i <= a.length; i++) dp[i] = [i]
      for (let j = 0; j <= b.length; j++) dp[0][j] = j
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
          else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
        }
      }
      return dp[a.length][b.length]
    }

    expect(editDistance('abc', 'abc')).toBe(0)
    expect(editDistance('abc', 'abd')).toBe(1)
    expect(editDistance('abc', 'ab')).toBe(1)
    expect(editDistance('abc', 'abcd')).toBe(1)
    expect(editDistance('abc', 'xyz')).toBe(3)
  })
})

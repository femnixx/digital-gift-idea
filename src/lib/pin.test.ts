import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

describe('PIN hashing and verification', () => {
  it('hashes and verifies a PIN', async () => {
    const hash = await bcrypt.hash('1234', 10)
    const valid = await bcrypt.compare('1234', hash)
    expect(valid).toBe(true)
  })

  it('rejects wrong PIN', async () => {
    const hash = await bcrypt.hash('1234', 10)
    const valid = await bcrypt.compare('0000', hash)
    expect(valid).toBe(false)
  })

  it('hashes are different for same PIN (salt)', async () => {
    const h1 = await bcrypt.hash('1234', 10)
    const h2 = await bcrypt.hash('1234', 10)
    expect(h1).not.toBe(h2)
  })
})

#!/usr/bin/env node
/**
 * Stops any running dev server.
 *
 * `next dev` and `next build` share the `.next` directory, so a dev server must
 * be stopped before a production build or they corrupt each other's artifacts.
 */
import { execSync } from 'node:child_process'

const patterns = ['next dev', 'next-server']

for (const pattern of patterns) {
  try {
    execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' })
    console.log(`[next] stopped processes matching: ${pattern}`)
  } catch {
    // pkill exits 1 when nothing matched.
  }
}

// Next binds its port asynchronously, so give the OS a moment before returning.
await new Promise((resolve) => setTimeout(resolve, 1500))
console.log('[next] dev server stopped')

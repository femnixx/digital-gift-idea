#!/usr/bin/env node
/**
 * Full recovery from a corrupted .next directory.
 *
 * Removes the build output and rebuilds it, which resolves the
 * "Cannot read properties of undefined (reading 'clientModules')" error caused
 * by a build and a dev server writing to .next at the same time.
 */
import { execSync } from 'node:child_process'

console.log('[next] stopping dev server if running...')
try {
  execSync('node scripts/stop-dev.mjs', { stdio: 'inherit' })
} catch {
  // stop-dev is best effort; the important part is clearing .next below.
}

console.log('[next] removing .next...')
try {
  execSync('rm -rf .next', { stdio: 'inherit' })
} catch (error) {
  console.error('[next] could not remove .next:', error.message)
  process.exit(1)
}

console.log('[next] done. Run `npm run dev` to start fresh.')

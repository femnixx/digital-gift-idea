#!/usr/bin/env node
/**
 * Refuses to run `next build` while a `next dev` server is live.
 *
 * `next dev` and `next build` both write to the same `.next` directory, and
 * interleaving them leaves production manifests sitting where the dev server
 * expects its own. That mismatch surfaces later as
 * "TypeError: Cannot read properties of undefined (reading 'clientModules')"
 * on every page, which is confusing to diagnose because the failure appears
 * long after the cause. Failing fast at build time is much cheaper.
 *
 * Exits non-zero when a dev server is detected.
 */
import { execSync } from 'node:child_process'

function findDevServer() {
  const commands = ['pgrep -af "next dev"', 'pgrep -af "next-server"']
  for (const command of commands) {
    try {
      const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
      if (output) {
        // Exclude this very process if the pattern matched itself.
        const lines = output.split('\n').filter((line) => !line.includes('guard-dev-server'))
        if (lines.length > 0) return lines.join('\n')
      }
    } catch {
      // pgrep exits 1 when nothing matched, which is the good case.
    }
  }
  return null
}

const running = findDevServer()

if (running) {
  console.error('\n[next] Refusing to build: a dev server is running.')
  console.error('[next] `next dev` and `next build` share the .next directory,')
  console.error('[next] and building over a live dev server corrupts it, which later')
  console.error('[next] shows up as: Cannot read properties of undefined')
  console.error("[next] (reading 'clientModules').\n")
  console.error('[next] Stop the dev server first, then build:\n')
  console.error('[next]   npm run dev:stop && npm run build')
  console.error('[next]\n[next] Detected:')
  for (const line of running.split('\n')) console.error(`[next]   ${line}`)
  console.error('')
  process.exit(1)
}

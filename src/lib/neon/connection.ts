/**
 * Single source of truth for the database connection string.
 *
 * Both the `sql` client (src/lib/neon/auth.ts) and `getNeonClient`
 * (src/lib/neon.ts) must resolve the endpoint identically. These two modules
 * previously disagreed on the order of the last two fallbacks, which meant the
 * app could silently talk to the pooled endpoint in one module and the direct
 * endpoint in the other when both env vars were set.
 *
 * Precedence: the pooled endpoint comes before the direct one. This app runs in
 * a serverless/Next.js runtime using the stateless HTTP driver, where Neon
 * recommends the pooled connection so many short-lived function invocations do
 * not exhaust the direct connection limit. `DATABASE_URL_UNPOOLED` remains last
 * as an escape hatch for one-off scripts and migrations that need a direct
 * connection (they bypass this resolver).
 */
export const CONNECTION_STRING_ENV_VARS = [
  'NEON_DATABASE_URL',
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
] as const

export function resolveConnectionString(): string | undefined {
  for (const name of CONNECTION_STRING_ENV_VARS) {
    const value = process.env[name]
    if (value && value.trim() !== '') return value
  }
  return undefined
}

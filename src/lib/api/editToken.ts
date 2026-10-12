/**
 * Anonymous ownership check.
 *
 * Gifts have no accounts. Authorship is proved by an unguessable edit token
 * minted at creation and shown once. Comparisons are length-checked and
 * constant-time so a wrong token cannot be recovered through timing, and every
 * caller returns 404 rather than 403 so the API never confirms a gift exists.
 */
export function authorisedByEditToken(
  entry: { edit_token?: string | null },
  token: string | null | undefined
): boolean {
  if (!token) return false

  const expected = entry.edit_token
  if (!expected) return false
  if (token.length !== expected.length) return false

  let diff = 0
  for (let i = 0; i < token.length; i += 1) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

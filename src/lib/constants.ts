/**
 * Canonical admin identity.
 *
 * The admin account is seeded in the database with this deterministic UUID so it
 * satisfies the `uuid` columns on `entries.created_by`, `love_diaries.user_id`,
 * and the `sessions.user_id` foreign key. Every module must resolve the admin
 * user to this id — never to the literal string `'admin'`.
 */
export const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Session lifetime in days.
 *
 * Single source of truth for the JWT expiry, the `sessions` row `expires_at`,
 * and the session cookie `maxAge`, so they cannot drift apart.
 */
export const SESSION_MAX_AGE_DAYS = 7
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60

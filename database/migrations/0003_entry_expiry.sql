-- Migration: gift expiry (TTL)
--
-- A gift may be given a lifetime, after which it is deleted from the database
-- rather than merely hidden. `expires_at` null means the gift is permanent.
--
-- The distinction from unlock_at matters: unlock_at hides content until a
-- moment, it never deletes anything. expires_at is a hard deletion deadline
-- enforced by the cleanup job in scripts/expire-entries.ts.
--
-- Idempotent: safe to run repeatedly.

ALTER TABLE entries ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN entries.expires_at IS
  'When set, the gift is deleted from the database after this time. Null means permanent.';

-- Supports the cleanup query, which scans for expired rows ordered by deadline.
CREATE INDEX IF NOT EXISTS idx_entries_expires_at ON entries(expires_at) WHERE expires_at IS NOT NULL;

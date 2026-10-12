-- Migration: anonymous gift ownership via edit token
--
-- Public accounts are gone: there is no sign-up or sign-in. A gift is created
-- anonymously and the creator keeps an unguessable edit token that grants
-- write access. The public link (/daily/<slug>) stays token-free so recipients
-- never need it, and a wrong or absent token returns 404 rather than confirming
-- the gift exists.
--
-- Idempotent: safe to run repeatedly.

ALTER TABLE entries ADD COLUMN IF NOT EXISTS edit_token UUID DEFAULT gen_random_uuid();

COMMENT ON COLUMN entries.edit_token IS
  'Unguessable token granting edit and delete rights. Returned once at creation.';

-- created_by is no longer required now that gifts can be created anonymously.
ALTER TABLE entries ALTER COLUMN created_by DROP NOT NULL;

-- Token lookups happen on every edit request.
CREATE INDEX IF NOT EXISTS idx_entries_edit_token ON entries(edit_token);

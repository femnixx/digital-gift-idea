-- Migration: backfill null timestamps on entries
--
-- Entries created before the API began supplying created_at/updated_at explicitly
-- have NULL timestamps. Because the admin list orders by created_at DESC and
-- Postgres sorts NULLs first in a DESC sort, those entries appear at the top of
-- the listing ahead of newer entries, and the composite index
-- idx_entries_created_by_created_at stores no ordering value for them.
--
-- Falls back through the most trustworthy remaining value for each row.
--
-- Idempotent: only rows that still have NULLs are touched.
UPDATE entries
SET created_at = COALESCE(created_at, publish_at, updated_at, NOW()),
    updated_at = COALESCE(updated_at, publish_at, created_at, NOW())
WHERE created_at IS NULL
   OR updated_at IS NULL;

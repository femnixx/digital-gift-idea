-- Migration: add composite index for owner-filtered, paginated entry lists
--
-- The admin entries API lists a user's entries ordered by created_at DESC with
-- LIMIT/OFFSET. Only single-column indexes existed, so each page required an
-- index scan on created_by followed by a sort. This composite index lets
-- Postgres read the page directly in the required order.
--
-- Idempotent: safe to run repeatedly.
CREATE INDEX IF NOT EXISTS idx_entries_created_by_created_at ON entries(created_by, created_at DESC);

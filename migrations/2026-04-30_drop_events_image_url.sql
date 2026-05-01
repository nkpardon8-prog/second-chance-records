-- Migration: Drop deprecated events.image_url column
-- Date: 2026-04-30
-- Run this in the Neon SQL editor against the production database.
-- Safe to run more than once: IF EXISTS guard.
--
-- Background: events.image_url was the original single-image-per-event field.
-- It was superseded by the event_images relational table on 2026-04-30 and
-- is no longer read by any code path. Confirmed via grep across src/, scripts/,
-- and netlify/ that nothing references it.
--
-- Pre-flight verify (optional): every row should have a NULL image_url.
--   SELECT count(*) FROM events WHERE image_url IS NOT NULL;
-- Expected: 0. If non-zero, those flyers exist only in the deprecated column
-- and would be lost on drop — migrate them into event_images first.

ALTER TABLE "events" DROP COLUMN IF EXISTS "image_url";

-- Migration: Add event_images table for multi-flyer support per event
-- Date: 2026-04-30
-- Run this in the Neon SQL editor against the production database.
-- Safe to run more than once: CREATE TABLE IF NOT EXISTS.
-- No data migration required: events.image_url is currently NULL for every row
-- (single-image upload feature shipped today, not yet used).

CREATE TABLE IF NOT EXISTS "event_images" (
  "id"          serial         PRIMARY KEY,
  "event_id"    integer        NOT NULL,
  "url"         text           NOT NULL,
  "sort_order"  integer        NOT NULL DEFAULT 0,
  "created_at"  timestamp      NOT NULL DEFAULT NOW(),
  CONSTRAINT "event_images_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
);

-- Index for the common lookup pattern: "all images for event N, in order".
CREATE INDEX IF NOT EXISTS "event_images_event_id_sort_order_idx"
  ON "event_images" ("event_id", "sort_order");

-- Verify (optional):
-- SELECT id, event_id, url, sort_order FROM event_images ORDER BY event_id, sort_order;
-- Expected: 0 rows initially.

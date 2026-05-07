-- Migration: Add pillars table + seed initial rows
-- Date: 2026-05-07
-- Run this in the Neon SQL editor against the production database (project super-unit-72722009).
-- Safe to run more than once: CREATE TABLE IF NOT EXISTS + INSERT guarded by NOT EXISTS.

-- 1. Create the table (matches src/lib/db/schema.ts pillars definition)
CREATE TABLE IF NOT EXISTS "pillars" (
  "id"          serial       PRIMARY KEY,
  "title"       varchar(200) NOT NULL,
  "description" text         NOT NULL,
  "link_url"    text,
  "link_label"  varchar(200),
  "sort_order"  integer      NOT NULL DEFAULT 0
);

-- 2. Seed the three current pillars, but ONLY if the table is empty.
-- Avoids duplicates if the migration is re-run after Tasha has edited
-- pillars through the admin UI.
INSERT INTO "pillars" ("title", "description", "link_url", "link_label", "sort_order")
SELECT * FROM (VALUES
  ('Record Restoration',
   'We give discarded vinyl a second life through careful cleaning, grading, and restoration.',
   'https://www.youtube.com/watch?v=wWO2m3AEWFA',
   'Watch the restoration process',
   0),
  ('Community Support',
   'We create welcoming spaces and support local organizations working on housing, recovery, and reentry.',
   NULL,
   NULL,
   1),
  ('Second Chances',
   'We believe in the power of second chances for everyone. Our hiring practices and partnerships reflect this value.',
   NULL,
   NULL,
   2)
) AS v(title, description, link_url, link_label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "pillars");

-- 3. Verify (optional — paste-and-run to confirm):
-- SELECT id, title, link_url, link_label, sort_order FROM "pillars" ORDER BY sort_order;

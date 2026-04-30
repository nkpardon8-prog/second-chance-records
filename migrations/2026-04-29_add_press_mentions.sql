-- Migration: Add press_mentions table + seed initial rows
-- Date: 2026-04-29
-- Run this in the Neon SQL editor against the production database.
-- Safe to run more than once: CREATE TABLE IF NOT EXISTS + INSERT guarded by NOT EXISTS.

-- 1. Create the table (matches src/lib/db/schema.ts pressMentions definition)
CREATE TABLE IF NOT EXISTS "press_mentions" (
  "id"         serial         PRIMARY KEY,
  "name"       varchar(200)   NOT NULL,
  "url"        text           NOT NULL,
  "sort_order" integer        NOT NULL DEFAULT 0
);

-- 2. Seed the two corrected deep-linked press mentions, but ONLY if the table is empty.
-- This avoids creating duplicates if the migration is re-run after Tasha has added
-- her own mentions through the admin UI.
INSERT INTO "press_mentions" ("name", "url", "sort_order")
SELECT * FROM (VALUES
  ('KMHD Jazz Radio', 'https://www.kmhd.org/article/2026/01/05/record-store-rundown/', 0),
  ('Willamette Week', 'https://www.wweek.com/music/2025/09/09/four-portland-record-stores-to-keep-in-heavy-rotation/', 1)
) AS v(name, url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "press_mentions");

-- 3. Verify (optional — paste-and-run to confirm the result):
-- SELECT id, name, url, sort_order FROM "press_mentions" ORDER BY sort_order;
--
-- Expected output:
--  id |       name        |                                          url                                           | sort_order
-- ----+-------------------+-----------------------------------------------------------------------------------------+------------
--   1 | KMHD Jazz Radio   | https://www.kmhd.org/article/2026/01/05/record-store-rundown/                           |          0
--   2 | Willamette Week   | https://www.wweek.com/music/2025/09/09/four-portland-record-stores-to-keep-in-heavy-rotation/ |          1

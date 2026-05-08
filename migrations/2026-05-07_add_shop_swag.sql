-- Run in Neon SQL editor (project super-unit-72722009 / branch production / db neondb).
-- Safe to run more than once. RUN BEFORE MERGING THE PR — see Tasks #11.

CREATE TABLE IF NOT EXISTS "shop_swag_items" (
  "id"          serial    PRIMARY KEY,
  "name"        varchar(200) NOT NULL,
  "description" text,
  "sort_order"  integer   NOT NULL DEFAULT 0,
  "created_at"  timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "shop_swag_images" (
  "id"          serial    PRIMARY KEY,
  "item_id"     integer   NOT NULL,
  "url"         text      NOT NULL,
  "sort_order"  integer   NOT NULL DEFAULT 0,
  "created_at"  timestamp NOT NULL DEFAULT NOW(),
  CONSTRAINT "shop_swag_images_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "shop_swag_items"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "shop_swag_images_item_id_sort_order_idx"
  ON "shop_swag_images" ("item_id", "sort_order");

-- Seed the editable swag purchase blurb. ContentEditor renders all rows for a
-- slug and has no "add section" UX, so the row must be inserted by migration.
INSERT INTO "page_content" ("page_slug", "section_key", "content_type", "content", "sort_order")
SELECT 'shop', 'swag_purchase_blurb', 'text',
  'These are made in small batches — come into the shop or DM us on Instagram to grab one.', 2
WHERE NOT EXISTS (
  SELECT 1 FROM "page_content"
  WHERE "page_slug" = 'shop' AND "section_key" = 'swag_purchase_blurb'
);

-- Verify
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_swag_items')  AS items_table,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_swag_images') AS images_table,
  EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'shop_swag_images_item_id_fkey') AS fk_exists,
  (SELECT count(*) FROM page_content WHERE page_slug = 'shop' AND section_key = 'swag_purchase_blurb') AS blurb_seeded;

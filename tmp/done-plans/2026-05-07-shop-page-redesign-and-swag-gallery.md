# Plan: Shop page redesign + multi-image swag gallery

> Brief: `./tmp/briefs/2026-05-07-shop-page-redesign-and-swag-gallery.md`
> Confidence: **9/10** (one-pass implementation, post-review)

## Goal

Three changes in one PR:
1. **Fix the shop description bug.** Wire `/shop` to read `getPageContent("shop")` so Tasha's saved Main Title and Description finally render. Mirrors the working `/about` pattern, including always-wrapping in InlineEditor so she can click-edit empty fields from the public page.
2. **Remove the three Discogs sections** (New Arrivals / Staff Picks / Local Artists) from the public `/shop` page. Keep `featured_records` table, `/admin/records`, and `DiscogsSection.tsx` intact for reversibility — Tasha said "for now."
3. **Build multi-image swag gallery** end-to-end: schema → migration → upload-folder allowlist → server actions → admin route → public render. Production-grade, cloning the events multi-image hardening (composite WHERE, prefix assertion, refuse-if-referenced orphan cleanup, TOCTOU rollback). **Clone — do not generalize — `MultiImageUploadField`.** Drift acceptable; blast-radius isolation more important.

## Verified prod state (Neon `super-unit-72722009` / branch `production` / db `neondb`)

```
SELECT page_slug, section_key, content, sort_order
  FROM page_content WHERE page_slug='shop' ORDER BY sort_order;
 → 1 | shop | main_title  | "Shop Our Records"           | 0
   2 | shop | description | "We are a brick & morter…"   | 1

SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='shop_swag_items')  AS items_exists,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='shop_swag_images') AS images_exists;
 → f | f

SELECT count(*) FROM event_images;
 → 0
```

Section keys use **underscore** (`main_title`, `description`), not hyphen. Public `/shop` only reads `shop-subtitle` via InlineEditor — completely different key, which is why Tasha's edits are invisible. Pre-existing `event_images` table is empty. New tables don't exist (clean slate).

## Architecture overview

```
[Tasha edits /admin/pages/shop]                     [Tasha edits /admin/shop-swag]
        |                                                       |
        v                                                       v
  page_content                                       shop_swag_items (1)──┬─▶ shop_swag_images (N)
   ├─ main_title                                      ├─ name             │ (FK ON DELETE CASCADE)
   ├─ description                                     ├─ description      │
   └─ swag_purchase_blurb (NEW seed row)              └─ sort_order       │
        |                                                                 |
        v                                                                 v
[Public /shop renders]                                          [Image blobs in
   ├─ Hero: main_title (or empty-state placeholder) — always wrapped in InlineEditor
   ├─ shop-subtitle (unchanged)
   ├─ Discogs CTA button (kept)
   ├─ Description (always wrapped in InlineEditor)
   ├─ Swag purchase blurb (always rendered when content non-empty,
   │  independent of item count — so Tasha sees changes immediately)
   └─ Swag grid (cards: image carousel + name + per-item description)        Netlify Blobs under
                                                                              swag/<uuid>.webp
                                                                              served via /api/images/<key>]
```

Three Discogs sections are deleted from the public render. `featuredRecords` table, `/admin/records`, `DiscogsSection.tsx`, and `getFeaturedRecords()` server action stay in place (admin nav still shows "Featured Records"). **`MultiImageUploadField` is left untouched**; swag uses a cloned `SwagMultiImageUploadField`.

## Files Being Changed

```
src/
  lib/
    db/
      schema.ts                                 ← MODIFIED  (add shopSwagItems + shopSwagImages tables)
    actions/
      shop-swag.ts                              ← NEW       (item CRUD + image add/remove/reorder + orphan cleanup, full event-images security pattern)
  app/
    shop/
      page.tsx                                  ← MODIFIED  (drop 3 DiscogsSection, read getPageContent("shop"), render swag grid, preserve metadata export)
    admin/
      shop-swag/
        page.tsx                                ← NEW       (server: loads items+images, passes to client)
        AdminShopSwagClient.tsx                 ← NEW       (list + inline-panel add/edit form, name + description + embedded SwagMultiImageUploadField)
    api/
      admin/
        upload/
          route.ts                              ← MODIFIED  (add "swag" to ALLOWED_FOLDERS)
  components/
    admin/
      SwagMultiImageUploadField.tsx             ← NEW       (cloned from MultiImageUploadField; calls shop-swag.ts actions; "swag/" prefix; "Maximum 10 images" wording)
      AdminSidebar.tsx                          ← MODIFIED  (insert "Shop Swag" entry in navItems near News/Featured Records/Partners)
    shop/
      SwagGrid.tsx                              ← NEW       (public render: card grid with ImageLightbox carousel)
  types/
    index.ts                                    ← MODIFIED  (add ShopSwagItem, ShopSwagImage, ShopSwagItemWithImages types)

migrations/
  2026-05-07_add_shop_swag.sql                  ← NEW       (idempotent: tables, FK, index, seed swag_purchase_blurb row)

tmp/briefs/
  2026-05-07-shop-page-redesign-and-swag-gallery.md   (existing)
```

`MultiImageUploadField.tsx` (events) is **not** touched. `src/app/admin/AdminLayoutClient.tsx` is **not** touched (it has no nav).

## Key pseudocode

### 1. New tables (`src/lib/db/schema.ts`)

Append after `eventImages`:

```ts
export const shopSwagItems = pgTable("shop_swag_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shopSwagImages = pgTable("shop_swag_images", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => shopSwagItems.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 2. Idempotent migration (`migrations/2026-05-07_add_shop_swag.sql`)

```sql
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
```

### 3. Upload route allowlist (`src/app/api/admin/upload/route.ts`)

```ts
// line ~13
const ALLOWED_FOLDERS = ["events", "news", "partners", "swag"] as const;
```

`"swag"` (no underscore) keeps lowercase/single-word convention with `events`/`news`/`partners`. No other changes — the sharp + heic-decode pipeline already handles every image type.

### 4. Server actions (`src/lib/actions/shop-swag.ts`) — written out in full

```ts
"use server";
import { db } from "@/lib/db";
import { shopSwagItems, shopSwagImages } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteImageBlob, keyFromImageUrl } from "@/lib/image-store";

const MAX_IMAGES_PER_ITEM = 10;
const SWAG_IMAGE_KEY_PREFIX = "swag/";

function assertOurSwagImageUrl(url: string): void {
  const key = keyFromImageUrl(url);
  if (!key || !key.startsWith(SWAG_IMAGE_KEY_PREFIX)) {
    throw new Error("Invalid image URL");
  }
}

// --- Reads ---

export async function getSwagItems() {
  const items = await db.select().from(shopSwagItems)
    .orderBy(asc(shopSwagItems.sortOrder), asc(shopSwagItems.id));
  const images = await db.select().from(shopSwagImages)
    .orderBy(asc(shopSwagImages.sortOrder), asc(shopSwagImages.id));
  // O(items × images) join in memory — acceptable for swag-scale workload.
  return items.map((it) => ({
    ...it,
    images: images.filter((img) => img.itemId === it.id),
  }));
}

// --- Item CRUD ---

export async function createSwagItem(fd: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name required");
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number | null>`max(${shopSwagItems.sortOrder})` })
    .from(shopSwagItems);
  const [row] = await db
    .insert(shopSwagItems)
    .values({ name, description, sortOrder: (maxOrder ?? -1) + 1 })
    .returning({ id: shopSwagItems.id });
  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
  return row.id;
}

export async function updateSwagItem(id: number, fd: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name required");
  await db.update(shopSwagItems)
    .set({ name, description })
    .where(eq(shopSwagItems.id, id));
  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

// IMPORTANT: deleting items requires deleting child rows individually FIRST so
// each blob delete can correctly check refuse-if-referenced against the (still
// populated) shop_swag_images table. If we delete the parent first, the cascade
// removes the children, then the count(*) check is always 0 and we'd wipe blobs
// even if a different item still references the same URL. (Reviewer A finding
// #4 / Reviewer B finding #6.)
export async function deleteSwagItem(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const childImages = await db
    .select({ id: shopSwagImages.id })
    .from(shopSwagImages)
    .where(eq(shopSwagImages.itemId, id));

  // Delete children one-by-one, reusing the same row-then-blob ordering and
  // refuse-if-referenced check that removeSwagImage uses. This naturally
  // handles cross-item URL dedupe.
  for (const { id: imageId } of childImages) {
    await removeSwagImage(imageId, id);
  }

  // Now safe to delete the parent. (No remaining child rows; cascade is a no-op.)
  await db.delete(shopSwagItems).where(eq(shopSwagItems.id, id));

  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

export async function reorderSwagItems(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  // Items are top-level (no parent), so no composite WHERE — different from
  // reorderEventImages by design. N sequential UPDATEs, not transactional;
  // partial failure leaves a half-reordered list. Acceptable for single-admin.
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(shopSwagItems)
      .set({ sortOrder: i })
      .where(eq(shopSwagItems.id, orderedIds[i]));
  }
  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

// --- Image CRUD --- (full pseudocode, NOT stubs)

export async function addSwagImage(itemId: number, url: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  assertOurSwagImageUrl(url);

  const [stats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      maxOrder: sql<number | null>`max(${shopSwagImages.sortOrder})`,
    })
    .from(shopSwagImages)
    .where(eq(shopSwagImages.itemId, itemId));

  const currentCount = stats?.count ?? 0;
  if (currentCount >= MAX_IMAGES_PER_ITEM) {
    throw new Error(`Maximum ${MAX_IMAGES_PER_ITEM} images per item`);
  }

  const [inserted] = await db
    .insert(shopSwagImages)
    .values({
      itemId,
      url,
      sortOrder: (stats?.maxOrder ?? -1) + 1,
    })
    .returning({ id: shopSwagImages.id });

  // TOCTOU rollback: re-count after insert and reverse if over cap.
  const [postCheck] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shopSwagImages)
    .where(eq(shopSwagImages.itemId, itemId));
  if ((postCheck?.count ?? 0) > MAX_IMAGES_PER_ITEM) {
    await db.delete(shopSwagImages).where(eq(shopSwagImages.id, inserted.id));
    throw new Error(`Maximum ${MAX_IMAGES_PER_ITEM} images per item`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

export async function removeSwagImage(imageId: number, itemId: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  // Composite WHERE prevents cross-item id enumeration.
  const [row] = await db
    .select({ url: shopSwagImages.url })
    .from(shopSwagImages)
    .where(and(eq(shopSwagImages.id, imageId), eq(shopSwagImages.itemId, itemId)))
    .limit(1);
  if (!row) return;

  // Row delete first, then conditional blob delete only if no other row points
  // at the same URL (cross-item URL dedupe).
  await db
    .delete(shopSwagImages)
    .where(and(eq(shopSwagImages.id, imageId), eq(shopSwagImages.itemId, itemId)));

  const [remaining] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shopSwagImages)
    .where(eq(shopSwagImages.url, row.url));
  if ((remaining?.count ?? 0) === 0) {
    await deleteImageBlob(row.url);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

export async function reorderSwagImages(itemId: number, orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shopSwagImages)
      .set({ sortOrder: i })
      .where(and(eq(shopSwagImages.id, orderedIds[i]), eq(shopSwagImages.itemId, itemId)));
  }
  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

export async function deleteOrphanSwagBlob(url: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  const key = keyFromImageUrl(url);
  if (!key || !key.startsWith(SWAG_IMAGE_KEY_PREFIX)) {
    throw new Error("Invalid image URL");
  }
  const [match] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shopSwagImages)
    .where(eq(shopSwagImages.url, url));
  if ((match?.count ?? 0) > 0) {
    return; // referenced — refuse rather than wipe a live row's blob
  }
  await deleteImageBlob(url);
}
```

### 5. SwagMultiImageUploadField (clone)

Copy `src/components/admin/MultiImageUploadField.tsx` (201 lines) verbatim to `src/components/admin/SwagMultiImageUploadField.tsx`. Then replace:
- Imports: `addEventImage` → `addSwagImage`, `removeEventImage` → `removeSwagImage`, `reorderEventImages` → `reorderSwagImages`, `deleteOrphanBlob` → `deleteOrphanSwagBlob` (all from `@/lib/actions/shop-swag`).
- Constants: `EVENT_IMAGE_KEY_PREFIX = "events/"` → `SWAG_IMAGE_KEY_PREFIX = "swag/"`.
- Props: `eventId: number` → `itemId: number`. `images: EventImage[]` → `images: { id: number; url: string }[]` (or import a `ShopSwagImage` type). The structural read of `img.id` and `img.url` is what's used — drop `eventId`/`sortOrder`/`createdAt` on the prop.
- Error message: `"Maximum ${MAX_IMAGES} images per event"` → `"Maximum ${MAX_IMAGES} images per item"` (both client- and server-side strings).
- Function calls: `addEventImage(eventId, ...)` → `addSwagImage(itemId, ...)`, etc.
- Upload `formData`: `fd.set("folder", "events")` → `fd.set("folder", "swag")`.

`MultiImageUploadField.tsx` itself is **untouched** — events admin keeps working exactly as before. Drift between the two clones is acceptable; can be reconciled in a future refactor-only PR.

### 6. Public `/shop` rewrite (`src/app/shop/page.tsx`)

```tsx
import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import { getSwagItems } from "@/lib/actions/shop-swag";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";
import ProseContent from "@/components/ui/ProseContent";
import SwagGrid from "@/components/shop/SwagGrid";

export const metadata: Metadata = {
  title: "Shop | Second Chance Records",
  description:
    "Browse our curated collection of restored vinyl records and shop swag. Visit us in Portland or DM to purchase.",
  openGraph: {
    title: "Shop | Second Chance Records",
    description:
      "Browse our curated collection of restored vinyl records on Discogs.",
  },
};

export default async function ShopPage() {
  const [content, swag] = await Promise.all([
    getPageContent("shop"),
    getSwagItems(),
  ]);

  const find = (key: string) => content.find((b) => b.sectionKey === key);
  const mainTitle = find("main_title");
  const description = find("description");
  const blurb = find("swag_purchase_blurb");

  return (
    <>
      <section className="bg-base text-cream py-20 grain-overlay torn-edge text-center">
        <div className="max-w-5xl mx-auto px-6">
          {mainTitle ? (
            <InlineEditor contentId={mainTitle.id} content={mainTitle.content}>
              <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">
                {mainTitle.content.trim() || "Shop"}
              </h1>
            </InlineEditor>
          ) : (
            // Row was somehow deleted. Use the seedable shape so it's recoverable.
            <InlineEditor pageSlug="shop" sectionKey="main_title" content="Shop Our Records">
              <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Shop</h1>
            </InlineEditor>
          )}

          <InlineEditor pageSlug="shop" sectionKey="shop-subtitle" content="Restored vinyl, ready for a second spin">
            <p className="font-mono text-sm text-kraft/70 uppercase tracking-wider mt-2">
              Restored vinyl, ready for a second spin
            </p>
          </InlineEditor>

          <div className="mt-8">
            <ExternalLink
              href="https://www.discogs.com/seller/SecondChance_Records/profile"
              className="inline-flex items-center justify-center rounded-sm bg-brick text-cream px-8 py-3.5 font-mono uppercase text-sm tracking-wider hover:bg-brick/90 transition-colors"
            >
              Browse Our Full Inventory on Discogs
            </ExternalLink>
          </div>
        </div>
      </section>

      <div className="bg-kraft py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {description ? (
            <InlineEditor contentId={description.id} content={description.content}>
              <div className="prose prose-lg mx-auto mb-12 font-sans leading-relaxed">
                <ProseContent text={description.content || "Tell visitors about your shop."} />
              </div>
            </InlineEditor>
          ) : null}
        </div>

        {/* Blurb renders independent of swag.length so Tasha sees edits even
            before adding her first item (Reviewer B finding #11). */}
        {blurb && blurb.content.trim() && (
          <div className="max-w-3xl mx-auto">
            <InlineEditor contentId={blurb.id} content={blurb.content}>
              <p className="font-mono text-sm text-base/80 text-center mb-8">
                {blurb.content}
              </p>
            </InlineEditor>
          </div>
        )}

        {swag.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <SwagGrid items={swag} />
          </div>
        )}
      </div>
    </>
  );
}
```

The three `<DiscogsSection>` calls and the `getFeaturedRecords` import are gone. Discogs CTA button stays — only the *featured records highlights* are removed. `metadata` export preserved.

### 7. SwagGrid public component (`src/components/shop/SwagGrid.tsx`)

Defense-in-depth filter: drop image rows whose URL doesn't decode to `swag/`. Mirrors `EventCard`'s defense.

```tsx
import { keyFromImageUrl } from "@/lib/image-store";
import ImageLightbox from "@/components/ui/ImageLightbox";

const SWAG_IMAGE_KEY_PREFIX = "swag/";

interface Item {
  id: number;
  name: string;
  description: string | null;
  images: { id: number; url: string }[];
}

interface Props { items: Item[]; }

export default function SwagGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const safeImages = item.images.filter((img) => {
          const key = keyFromImageUrl(img.url);
          return key !== null && key.startsWith(SWAG_IMAGE_KEY_PREFIX);
        });

        return (
          <article key={item.id} className="bg-card border border-white/5 rounded-sm overflow-hidden">
            {safeImages.length > 0 ? (
              <>
                <div className="relative aspect-square bg-base">
                  <ImageLightbox
                    src={safeImages[0].url}
                    alt={`${item.name} — photo 1 of ${safeImages.length}`}
                    thumbnailClassName="w-full h-full"
                    imgClassName=""
                  />
                </div>
                {safeImages.length > 1 && (
                  <div className="flex gap-1 p-2 overflow-x-auto">
                    {safeImages.slice(1).map((img, i) => (
                      <ImageLightbox
                        key={img.id}
                        src={img.url}
                        alt={`${item.name} — photo ${i + 2} of ${safeImages.length}`}
                        thumbnailClassName="w-12 h-12 flex-shrink-0"
                        imgClassName=""
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              // No safe images — render the card with text only.
              <div className="aspect-square bg-base/50 flex items-center justify-center text-kraft/50 text-sm font-mono">
                Photo coming soon
              </div>
            )}

            <div className="p-4">
              <h3 className="font-heading text-lg uppercase tracking-tight text-cream mb-1">
                {item.name}
              </h3>
              {item.description && (
                <p className="font-sans text-sm text-kraft/80 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
```

### 8. Admin route (`src/app/admin/shop-swag/`)

`page.tsx`:

```tsx
import { getSwagItems } from "@/lib/actions/shop-swag";
import AdminShopSwagClient from "./AdminShopSwagClient";

export default async function AdminShopSwagPage() {
  const items = await getSwagItems();
  return <AdminShopSwagClient items={items} />;
}
```

`AdminShopSwagClient.tsx`: list view with reorder arrows, "Add Item" button, "Edit"/"Delete" per item. Edit panel shows name + description fields, plus the `<SwagMultiImageUploadField itemId={item.id} images={item.images} label="Images" />`. **No `confirm()` on delete** — matches codebase pattern (per CLAUDE.local.md "DO NOT use confirm() for destructive admin actions"). Pattern copies the inline-panel shell from `src/app/admin/news/AdminNewsClient.tsx`.

Auth gating: this page sits under `src/app/admin/layout.tsx` which already enforces session via the layout. No additional `getSession()` checks in the page component itself.

`AdminSidebar.tsx`: add `{ href: "/admin/shop-swag", label: "Shop Swag" }` to `navItems` (line ~11), placed near News / Featured Records / Partners. **Do not modify `src/app/admin/AdminLayoutClient.tsx`** — it has no nav.

## Tasks (implementation order)

1. **Schema**: Add `shopSwagItems` and `shopSwagImages` Drizzle table definitions to `src/lib/db/schema.ts`.
2. **Migration SQL**: Write `migrations/2026-05-07_add_shop_swag.sql` (idempotent CREATE + FK + index + seed `swag_purchase_blurb` row).
3. **Types**: Add `ShopSwagItem`, `ShopSwagImage`, `ShopSwagItemWithImages` to `src/types/index.ts`.
4. [x] **Upload allowlist**: Add `"swag"` to `ALLOWED_FOLDERS` in `src/app/api/admin/upload/route.ts`.
5. **Server actions**: Create `src/lib/actions/shop-swag.ts` with all functions written out per section 4 pseudocode (item CRUD + image CRUD + orphan cleanup, every security guard).
6. [x] **Clone admin client**: Copy `src/components/admin/MultiImageUploadField.tsx` → `src/components/admin/SwagMultiImageUploadField.tsx`. Apply renames per section 5.
7. [x] **Public component**: Create `src/components/shop/SwagGrid.tsx` with `swag/` prefix filter and ImageLightbox carousel.
8. [x] **Public page rewrite**: Rewrite `src/app/shop/page.tsx` per section 6 — drop `getFeaturedRecords` and three `DiscogsSection` calls, read `getPageContent("shop")`, render hero/description/blurb/grid. Preserve `metadata` export. Always wrap hero + description in InlineEditor.
9. [x] **Admin route**: Create `src/app/admin/shop-swag/page.tsx` (server) and `AdminShopSwagClient.tsx` (client list + add/edit inline panels with name/description inputs + embedded `SwagMultiImageUploadField`). Delete buttons issue `deleteSwagItem` directly with no `confirm()`.
10. [x] **Admin nav**: Add "Shop Swag" link in `src/components/admin/AdminSidebar.tsx` `navItems` array (NOT in AdminLayoutClient.tsx).
11. **Run migration in Neon BEFORE merge**: After preview build is green but before merging, paste `migrations/2026-05-07_add_shop_swag.sql` into the SQL editor in project `super-unit-72722009`, branch `production`, db `neondb`. Verify the verify-block returns true/true/true/1. Idempotent SQL is safe to run while old code is live; old code doesn't reference the new tables.
12. **Type check + lint**: `npx tsc --noEmit` (must be clean) and `npm run lint` (must not exceed baseline of 12 problems — new code adds 0).
13. **Push branch + open PR**: branch `feat/shop-swag-and-redesign`, PR base `main`. Watch Netlify preview build green.
14. **Merge after migration is verified**: `gh pr merge --squash --delete-branch`.
15. **Smoke test on prod via chrome-devtools** (tab 18 cookie required):
    - Navigate `/admin/shop-swag`. Confirm empty state.
    - Click "Add Item". Type `Test Tee — XL` and a description. Save.
    - Edit the new item, upload 2 fixture PNGs (use `/tmp/scr-test-*.png` recipe from CLAUDE.local.md). Confirm `2 / 10` counter.
    - Reload public `/shop`. Verify: (a) Tasha's saved description "We are a brick & morter…" renders; (b) `swag_purchase_blurb` renders above grid; (c) swag card shows both images via ImageLightbox; (d) New Arrivals/Staff Picks/Local Artists are GONE.
    - Reorder images via ▲/▼. Confirm sort persists after reload.
    - Remove one image. Confirm `1 / 10` counter and that the public page reflects.
    - Delete the test item. Confirm cascade — public page no longer shows it; Netlify Blobs no longer hold the test images.
    - Curl probe: `curl -sS https://secondchancerecords.com/shop | grep -E "brick|made in small batches"` — both should appear.
16. **Email Tasha**: Send the post-deploy email per brief Step 4 — explain the description bug fix, the new `/admin/shop-swag` flow, the three sections being gone "for now," and the "if first action errors after deploy, just reload" note for server-action-id staleness.

## Validation gates

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → ≤ 12 problems (baseline; new code adds 0)
- Idempotent SQL: running migration twice produces no error and no duplicate `swag_purchase_blurb` row
- Public `/shop` curl smoke: `curl -sS https://secondchancerecords.com/shop | grep -E "brick|made in small batches"` → finds both
- Admin `/admin/shop-swag` accessible to logged-in admin only (layout enforces; manual probe with no cookie returns 401/redirect)
- POST `/api/admin/upload` with `folder=swag` succeeds for image; `folder=anything_else` returns 400
- chrome-devtools smoke per Task #15

## Error handling

- All server actions throw on `!session.isLoggedIn` → reaches `error.tsx` boundary
- `addSwagImage` enforces `MAX_IMAGES_PER_ITEM = 10` with TOCTOU post-insert rollback (full code in section 4, mirrors event-images.ts)
- `addSwagImage`, `deleteOrphanSwagBlob` reject any URL whose decoded key doesn't start with `swag/`
- `removeSwagImage` uses composite WHERE on (id, itemId); blob is deleted only after no remaining row references the same URL
- `deleteSwagItem` deletes children one-by-one via `removeSwagImage` first, THEN deletes parent — so cross-item URL dedupe still works (cascade-then-count would always be 0 and silently wipe shared blobs)
- `deleteOrphanSwagBlob` refuses if any current row references the URL (prevents arbitrary blob deletion via forged client call)
- `SwagMultiImageUploadField` orphan-cleanup fires on `addSwagImage` failure post-upload: `deleteOrphanSwagBlob(uploadedUrl).catch(() => undefined)`
- Public `SwagGrid` filters image rows by `keyFromImageUrl(url) startsWith "swag/"` — defense in depth even if a bad row landed in the DB

## Deprecated code to remove

None during this PR. The brief decision is to **keep** `featured_records` table, `getFeaturedRecords()` server action, `DiscogsSection.tsx`, `/admin/records` route, and `recordSchema` validation in place. They're disconnected from `/shop` but still reachable via `/admin/records` and intact for reversibility. Drop them in a follow-up PR if Tasha confirms permanent kill.

## Gotchas

1. **`ContentEditor` has no "add section" UI.** The `swag_purchase_blurb` row MUST be inserted by migration SQL. Tasha will then see it in `/admin/pages/shop` automatically because the editor renders all rows for a slug. The `WHERE NOT EXISTS` guard is critical — re-running the migration must not duplicate the row.
2. **`InlineEditor` has two prop-shapes.** It accepts EITHER `(contentId, content, children)` for editing an existing row OR `(pageSlug, sectionKey, content, children)` for creating a new one. The new shop hero uses the first shape (row exists), the unchanged subtitle keeps the second shape, the description uses the first. Don't mix them up.
3. **Post-deploy server-action ID staleness.** Tasha's loaded `/admin` tab will return "Server Action … was not found" on the first action after deploy. Reload fixes. Document in the email; not patched in this PR.
4. **Sharp + heic-decode pipeline is shared.** Adding `swag` to `ALLOWED_FOLDERS` immediately gives swag uploads HEIC, auto-resize-to-2000px, and webp re-encode for free. No extra config.
5. **`NEXT_PUBLIC_SITE_URL` env-drift** is still present (Netlify env points at the netlify.app subdomain). New swag image rows will store `https://second-chance-records.netlify.app/api/images/swag/<uuid>.webp`. This works (Netlify serves both domains) but is not canonical. Out of scope; tracked in Things To Fix Later #1.
6. **Tasha's existing `main_title` and `description` rows are populated** (verified via Neon). The new `/shop` render is non-conditional for these — once deployed, her content appears immediately. No backfill needed.
7. **`AdminLayoutClient.tsx` is NOT the nav file.** Easy to mistarget — nav lives in `src/components/admin/AdminSidebar.tsx`.
8. **`deleteSwagItem` order matters for blob dedupe.** Children deleted via `removeSwagImage` before parent delete — see section 4 long comment.
9. **`MultiImageUploadField` is untouched.** Events admin path is unchanged — zero regression risk on events. Drift between event/swag clones acceptable.
10. **Migration runs BEFORE merge**, not after. Idempotent SQL is safe against the old code; new code without the table is not safe to ship.
11. **Lint baseline is 12** problems (5 errors, 7 warnings) all in untouched files. New code must add 0.

## Reference patterns (verified in codebase)

- `src/app/about/page.tsx:20-74` — `getPageContent` + InlineEditor render pattern
- `src/lib/actions/event-images.ts:1-145` — full security model being cloned
- `src/components/admin/MultiImageUploadField.tsx:1-201` — UI being cloned (not generalized)
- `src/components/events/EventCard.tsx:70-104` — public render with `key.startsWith(prefix)` filter
- `src/app/admin/news/AdminNewsClient.tsx` — list + add/edit inline panel shell to copy
- `src/app/api/admin/upload/route.ts:13` — `ALLOWED_FOLDERS` line
- `src/lib/db/schema.ts:41-49` — `event_images` table shape mirrored for `shop_swag_images`
- `src/components/admin/AdminSidebar.tsx` — `navItems` array (not `AdminLayoutClient.tsx`)
- `src/lib/actions/content.ts:33` — `updatePageContent` revalidates `/${pageSlug}`, so blurb edits propagate to `/shop`

## Confidence: 9/10

The remaining 1 point is for `MultiImageUploadField` cloning leaving two near-identical files in the tree until a future refactor — accepted tradeoff for blast-radius isolation, surfaced in CLAUDE.local.md "Things To Fix Later" for cleanup later.

# Brief: Shop page redesign + swag gallery

## Why

Tasha emailed + sent a Loom asking for three changes to `/shop`:

1. Eliminate the New Arrivals / Staff Picks / Local Artists Discogs sections "for now."
2. Her admin edits to the Shop page (main title + description) save successfully but never appear on the live page — she literally can't see her own copy. This is a real bug.
3. She wants to add **shop swag** (t-shirts, hats, slip mats, etc.) — multiple photos per item — with a description per item. She wants a note about how to buy ("come into the shop or DM me").

Nick's direction: build the swag system the same way we did multi-image events — production-grade, modular, multi-image per item, with the database reflecting state cleanly.

## Context

### Current `/shop` (verified live via chrome-devtools)
- Hero: hardcoded `<h1>SHOP</h1>` + InlineEditor for `shop-subtitle` ("RESTORED VINYL, READY FOR A SECOND SPIN") + Discogs CTA button.
- Three `<DiscogsSection>` instances render below: NEW ARRIVALS, STAFF PICKS, LOCAL ARTISTS — all driven by `getFeaturedRecords()` filtering `featured_records` rows by category.
- **No description rendered anywhere on the public page.**

### Admin `/admin/pages/shop` (verified live)
- Generic page editor (`src/app/admin/pages/[slug]/page.tsx`) renders ContentEditor.
- Two textareas saved in DB: `MAIN TITLE = "Shop Our Records"` and `DESCRIPTION = "We are a brick & morter record shop where you can browse our full used record inventory in-person.  We also offer a few items on Discogs for those of you out of the area."`
- Both fields persist into `page_content` table — but **neither is read by `src/app/shop/page.tsx`**. The shop page never calls `getPageContent("shop")`. It only reads the `shop-subtitle` key via InlineEditor. So Tasha is editing keys (`main-title` + `description`) that nothing on the public page renders. Compare: `/about` reads its description correctly via `getPageContent("about")` — that's the working reference pattern.

### `page_content` schema (`src/lib/db/schema.ts:17-24`)
```
id, pageSlug, sectionKey, contentType, content, sortOrder
```
Composite identity is `(pageSlug, sectionKey)`.

### Multi-image upload reference (events — to clone for swag)
- DB: `event_images` table — `id, eventId, url, sortOrder, createdAt` (`schema.ts:41-49`)
- Server actions: `src/lib/actions/event-images.ts` — `addEventImage`, `removeEventImage(imageId, eventId)` composite-WHERE, `reorderEventImages`, `deleteOrphanBlob` (refuse-if-referenced)
- Upload route: `src/app/api/admin/upload/route.ts` — folder allowlist `["events","news","partners"]` (line 13)
- Client: `src/components/admin/MultiImageUploadField.tsx` — drag-reorder, 10-image cap, instant upload, delete, `router.refresh()` after each mutation
- Public: `src/components/events/EventCard.tsx:70-104` — gallery grid + ImageLightbox, defense-in-depth filter on `key.startsWith("events/")`
- Image pipeline: `src/lib/image-processing.ts` — sharp + heic-decode fallback, 2000px cap, webp@80, EXIF strip

### Featured-records system to remove from `/shop`
- `src/app/shop/page.tsx` lines 2 (import), 19-23 (fetch), 48-50 (render 3 DiscogsSection)
- `src/components/shop/DiscogsSection.tsx`
- `src/lib/actions/records.ts` (`getFeaturedRecords`, CRUD)
- `src/app/admin/records/page.tsx`
- `src/lib/db/schema.ts:61-70` `featuredRecords` table
- `src/lib/validations/record.ts`

## Decisions

- **Fix the description-rendering bug as part of this work.** Public `/shop` will read `getPageContent("shop")` and render the Main Title (replacing hardcoded "SHOP") and Description below the hero, mirroring the `/about` pattern exactly. — *reasoning: it's the root cause of Tasha's "where did my edits go?" frustration; one-component change; same pattern already proven on `/about`.*

- **Hide the three featured-records sections from `/shop`, but keep the underlying machinery in place.** Remove the three DiscogsSection calls + the `getFeaturedRecords` import/fetch from `shop/page.tsx`. Leave `featured_records` table, `/admin/records` route, server actions, and DiscogsSection component intact. — *reasoning: Tasha said "for now" — implies she may want them back. Cost of keeping the table/admin alive but disconnected is ~zero. If she confirms permanent kill later, dropping is trivial.*

- **New `shop_swag` system, multi-image per item, prod-grade — clone the events multi-image pattern.**
  - **DB**: two new tables.
    - `shop_swag_items`: `id (serial PK)`, `name (varchar 200)`, `description (text)`, `sortOrder (int)`, `createdAt (timestamp)`.
    - `shop_swag_images`: `id (serial PK)`, `itemId (int FK → shop_swag_items.id ON DELETE CASCADE)`, `url (text)`, `sortOrder (int)`, `createdAt (timestamp)`.
  - **Migration**: idempotent SQL (`CREATE TABLE IF NOT EXISTS`), filed in `migrations/2026-05-07_add_shop_swag.sql`. Run manually in Neon after deploy. Drizzle schema added in `src/lib/db/schema.ts`.
  - **Upload folder**: add `"shop_swag"` to `ALLOWED_FOLDERS` in `src/app/api/admin/upload/route.ts`. Reuses sharp + heic pipeline as-is.
  - **Server actions** (`src/lib/actions/shop-swag.ts`): `createSwagItem`, `updateSwagItem`, `deleteSwagItem` (cascades images via FK), `reorderSwagItems`, `addSwagImage(itemId, url)` (cap 10/item, prefix-validate `shop_swag/`), `removeSwagImage(imageId, itemId)` composite WHERE, `reorderSwagImages`, `deleteOrphanBlob` (refuse-if-referenced — clone from event-images.ts).
  - **Admin UI**: new route `/admin/shop-swag` listing swag items with add/edit/delete. Item edit screen has name + description text fields and a `MultiImageUploadField` reused (generalize props from `eventId`/`images: EventImage[]` to `parentId`/`images: {id:number; url:string}[]` + a config object for the server actions to call). Or: copy MultiImageUploadField into a sibling component if generalization risks regression on events.
  - **Public render** on `/shop`: a "SHOP SWAG" section between description and the (newly-removed) Discogs blocks. Grid of cards: image carousel/lightbox, item name, description. One shared "Available in shop or DM @secondchancerecords" blurb above the grid (stored as a new section_key `swag-purchase-blurb` in `page_content`, editable via the existing shop page editor) — Tasha doesn't have to retype it per item.
  - **Defense-in-depth**: public render filters images by `key.startsWith("shop_swag/")`, mirroring EventCard's pattern.
  - — *reasoning: matches the exact prod-hardened pattern from PR #10/#11/#12 (composite WHERE, refuse-if-referenced, prefix assertion, cap, origin assertion). Production-grade, no shortcuts. Two-table model is the only honest fit for "items each with multiple images" — squashing into one JSON column would be a downgrade.*

- **Generalize MultiImageUploadField vs duplicate**: lean toward **generalize** — its props become `parentId: number; images: {id:number; url:string}[]; folder: "events" | "shop_swag"; actions: { add, remove, reorder, deleteOrphan }`. Saves drift between two near-identical files, but introduces shared-component risk. *Final call deferred to /plan.*

- **Section ordering on `/shop`** (top to bottom): Hero (title + subtitle + Discogs CTA) → Description → Swag purchase blurb → Swag grid. Discogs button stays since the Discogs catalog itself is still relevant; only the three "highlighted records" sections come down.

## Rejected Alternatives

- **Single image per swag item** (mirror news/partners) — rejected per Nick's explicit direction: multi-image per item, prod-grade.
- **Squash swag into a single JSON column on `page_content`** — rejected: not relational, breaks ordering, breaks per-image deletion/cleanup, breaks blob orphan tracking.
- **Full delete of featured-records system right now** — rejected: Tasha said "for now"; reversibility wins.
- **Per-item buy blurb only (no shared one)** — rejected: forces Tasha to retype the same buy-instructions on every item; tedium = drift.
- **Both per-item description AND duplicating the shared buy-blurb in each item** — rejected: redundant; one shared blurb above the grid + per-item description (size, color, etc.) is cleaner.
- **Read swag-purchase-blurb from a hardcoded constant** — rejected: Tasha needs to be able to edit it without a deploy.

## Where Reasoning Clashed

- **Generalize `MultiImageUploadField` vs. clone it for swag**: real tradeoff. Generalizing avoids 200 lines of near-duplication and means future fixes (e.g., a bug in the reorder optimistic UI) get fixed once. But it means both events and swag share a blast radius — a regression in the shared component breaks two surfaces at once on prod. Cloning is safer for stability but bakes in long-term drift. A reasonable person could go either way. Recommend generalization with a single clean parameterization and lock it in via the implementation review pass — but if the abstraction starts looking ugly during /plan, switch to clone.

- **Keep vs. delete the featured-records system**: "for now" is doing a lot of work. If Tasha confirms it's permanent, deletion is cleaner (less dead code, smaller bundle, fewer admin nav items confusing her). Defending "keep" only because the user used hedge words is borderline. A reasonable person would push Tasha for a yes/no before keeping dead admin routes around. *Recommendation: keep for this round, ask Tasha in the follow-up email.*

## One Thing to Do First

Add the `shop_swag_items` + `shop_swag_images` tables to `src/lib/db/schema.ts` and write the idempotent SQL migration file. Schema-first locks in the data model before any UI or action code is written.

## Direction

Three changes shipped in one PR (or two if scope feels heavy at /plan time): (1) wire `/shop` to read `getPageContent("shop")` so Tasha's description bug is fixed, (2) remove the three DiscogsSection blocks from the public page, (3) build the multi-image swag system end-to-end (schema, migration, upload-folder allowlist, server actions, admin route, public render) cloning the events multi-image pattern.

After implementation, draft an email back to Tasha explaining: where her description now appears (and that it was a bug, not her), how the swag admin works, where to send photos, and confirming the three sections are gone "for now."

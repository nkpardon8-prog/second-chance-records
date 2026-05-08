"use server";

import { db } from "@/lib/db";
import { shopSwagItems, shopSwagImages } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteImageBlob, keyFromImageUrl } from "@/lib/image-store";
import type { ShopSwagItemWithImages } from "@/types";

const MAX_IMAGES_PER_ITEM = 10;
const SWAG_IMAGE_KEY_PREFIX = "swag/";

// Defense in depth: only accept URLs that came out of our own upload route
// under the swag/ prefix. Without this an authenticated admin (or anyone
// holding the iron-session cookie) could store an arbitrary URL and the
// public SwagGrid would render it directly, exposing visitors to XSS / SSRF
// / link injection.
function assertOurSwagImageUrl(url: string): void {
  const key = keyFromImageUrl(url);
  if (!key || !key.startsWith(SWAG_IMAGE_KEY_PREFIX)) {
    throw new Error("Invalid image URL");
  }
}

// --- Reads ---

export async function getSwagItems(): Promise<ShopSwagItemWithImages[]> {
  const items = await db
    .select()
    .from(shopSwagItems)
    .orderBy(asc(shopSwagItems.sortOrder), asc(shopSwagItems.id));
  const images = await db
    .select()
    .from(shopSwagImages)
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
  await db
    .update(shopSwagItems)
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
    await db
      .update(shopSwagItems)
      .set({ sortOrder: i })
      .where(eq(shopSwagItems.id, orderedIds[i]));
  }
  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

// --- Image CRUD ---

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

  // TOCTOU guard: two parallel inserts could both pass the count check above.
  // Post-insert, re-count and roll back the just-inserted row if we're now
  // over the cap. Simpler than transactions on the Neon HTTP driver.
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

  // Composite WHERE prevents cross-item id enumeration: an admin (or anyone
  // holding the cookie) can't enumerate ids across items to delete other
  // items' images. The select + delete both scope by (id, item_id).
  const [row] = await db
    .select({ url: shopSwagImages.url })
    .from(shopSwagImages)
    .where(and(eq(shopSwagImages.id, imageId), eq(shopSwagImages.itemId, itemId)))
    .limit(1);
  if (!row) return;

  // Row delete first, then a conditional blob delete only if no remaining
  // shop_swag_images row references the same URL. Reverses the naive order
  // (blob first, then row) so a duplicate row pointing at the same blob
  // doesn't break the surviving thumbnail.
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

  // Constrain each UPDATE to images that belong to the given item. Without
  // the itemId guard, a caller could pass IDs of images belonging to a
  // different item and rewrite their sort_order — cross-row tampering even
  // among trusted admins. The composite WHERE makes mismatched IDs no-op.
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shopSwagImages)
      .set({ sortOrder: i })
      .where(and(eq(shopSwagImages.id, orderedIds[i]), eq(shopSwagImages.itemId, itemId)));
  }

  revalidatePath("/shop");
  revalidatePath("/admin/shop-swag");
}

// Best-effort orphan cleanup for the case where a blob upload succeeded but
// the subsequent addSwagImage threw. Without this the blob lives in storage
// forever with no row pointing to it.
//
// Hardening: refuse to delete a URL that any current shop_swag_images row
// references. A forged client call could otherwise pass the URL of a live
// image and wipe it under the guise of orphan cleanup. The swag/ prefix
// gate is kept so a forged Instagram/news URL still no-ops at the URL level.
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
    // Not actually orphaned — refuse rather than wipe a live row's blob.
    return;
  }
  await deleteImageBlob(url);
}

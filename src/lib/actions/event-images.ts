"use server";

import { db } from "@/lib/db";
import { eventImages } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteImageBlob, keyFromImageUrl } from "@/lib/image-store";

const MAX_IMAGES_PER_EVENT = 10;
const EVENT_IMAGE_KEY_PREFIX = "events/";

// Defense in depth: only accept URLs that came out of our own upload route
// under the events/ prefix. Without this an authenticated admin (or anyone
// holding the iron-session cookie) could store an arbitrary URL like
// `https://evil.com/track.png` or `javascript:...` and the public EventCard
// would render it directly, exposing visitors to XSS / SSRF / link injection.
function assertOurEventImageUrl(url: string): void {
  const key = keyFromImageUrl(url);
  if (!key || !key.startsWith(EVENT_IMAGE_KEY_PREFIX)) {
    throw new Error("Invalid image URL");
  }
}

export async function getEventImages(eventId: number) {
  return db
    .select()
    .from(eventImages)
    .where(eq(eventImages.eventId, eventId))
    .orderBy(asc(eventImages.sortOrder));
}

export async function addEventImage(eventId: number, url: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  assertOurEventImageUrl(url);

  const [stats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      maxOrder: sql<number | null>`max(${eventImages.sortOrder})`,
    })
    .from(eventImages)
    .where(eq(eventImages.eventId, eventId));

  const currentCount = stats?.count ?? 0;
  if (currentCount >= MAX_IMAGES_PER_EVENT) {
    throw new Error(`Maximum ${MAX_IMAGES_PER_EVENT} images per event`);
  }

  const [inserted] = await db
    .insert(eventImages)
    .values({
      eventId,
      url,
      sortOrder: (stats?.maxOrder ?? -1) + 1,
    })
    .returning({ id: eventImages.id });

  // TOCTOU guard: two parallel inserts could both pass the count check above.
  // Post-insert, re-count and roll back the just-inserted row if we're now
  // over the cap. Simpler than transactions on the Neon HTTP driver.
  const [postCheck] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventImages)
    .where(eq(eventImages.eventId, eventId));
  if ((postCheck?.count ?? 0) > MAX_IMAGES_PER_EVENT) {
    await db.delete(eventImages).where(eq(eventImages.id, inserted.id));
    throw new Error(`Maximum ${MAX_IMAGES_PER_EVENT} images per event`);
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

// Best-effort orphan cleanup for the case where a blob upload succeeded but
// the subsequent addEventImage threw. Without this the blob lives in storage
// forever with no row pointing to it.
//
// Only accepts URLs whose key lives under the events/ prefix — without this
// any authenticated admin could pass an Instagram/news/etc blob URL and wipe
// it. Same-origin assertion blocks malformed URLs too.
export async function deleteOrphanBlob(url: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  const key = keyFromImageUrl(url);
  if (!key || !key.startsWith(EVENT_IMAGE_KEY_PREFIX)) {
    throw new Error("Invalid image URL");
  }
  await deleteImageBlob(url);
}

export async function removeEventImage(imageId: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const [row] = await db
    .select({ url: eventImages.url })
    .from(eventImages)
    .where(eq(eventImages.id, imageId))
    .limit(1);
  if (!row) return;

  // Delete blob first (best-effort), then row. If blob delete fails the row is
  // still removed — orphan blob is recoverable, broken row is not.
  await deleteImageBlob(row.url);
  await db.delete(eventImages).where(eq(eventImages.id, imageId));

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

export async function reorderEventImages(eventId: number, orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  // Constrain each UPDATE to images that belong to the given event. Without
  // the eventId guard, a caller could pass IDs of images belonging to a
  // different event and rewrite their sort_order — cross-row tampering even
  // among trusted admins. The composite WHERE makes mismatched IDs no-op.
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(eventImages)
      .set({ sortOrder: i })
      .where(and(eq(eventImages.id, orderedIds[i]), eq(eventImages.eventId, eventId)));
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

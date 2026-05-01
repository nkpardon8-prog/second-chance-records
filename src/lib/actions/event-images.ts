"use server";

import { db } from "@/lib/db";
import { eventImages } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteImageBlob } from "@/lib/image-store";

const MAX_IMAGES_PER_EVENT = 10;

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
export async function deleteOrphanBlob(url: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
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

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(eventImages)
      .set({ sortOrder: i })
      .where(eq(eventImages.id, orderedIds[i]));
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

"use server";

import { db } from "@/lib/db";
import { events, eventImages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/validations/event";
import { deleteImageBlob } from "@/lib/image-store";

export async function getEvents(publishedOnly?: boolean) {
  if (publishedOnly) {
    return db
      .select()
      .from(events)
      .where(eq(events.isPublished, true))
      .orderBy(asc(events.date), asc(events.sortOrder));
  }
  return db.select().from(events).orderBy(asc(events.date), asc(events.sortOrder));
}

export async function createEvent(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = eventSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    artistName: formData.get("artistName") || undefined,
    artistUrl: formData.get("artistUrl") || undefined,
  });

  await db.insert(events).values({
    title: parsed.title,
    description: parsed.description ?? null,
    date: parsed.date,
    time: parsed.time ?? null,
    artistName: parsed.artistName ?? null,
    artistUrl: parsed.artistUrl || null,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

export async function updateEvent(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = eventSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    artistName: formData.get("artistName") || undefined,
    artistUrl: formData.get("artistUrl") || undefined,
  });

  await db
    .update(events)
    .set({
      title: parsed.title,
      description: parsed.description ?? null,
      date: parsed.date,
      time: parsed.time ?? null,
      artistName: parsed.artistName ?? null,
      artistUrl: parsed.artistUrl || null,
    })
    .where(eq(events.id, id));

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

// Mirrors toggleNewsPublished in news.ts. Used by the admin Publish button on
// auto-discovered events; keeps the publish-state flip as a focused typed
// action instead of round-tripping the entire event through updateEvent.
export async function toggleEventPublished(id: number, isPublished: boolean) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.update(events).set({ isPublished }).where(eq(events.id, id));

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

export async function deleteEvent(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  // Order matters: delete blobs FIRST, then the row. If we crash mid-cleanup,
  // the event row is still there for the next delete attempt to retry. The
  // alternative (row delete first, then blob cleanup) means a mid-flight crash
  // strands blobs forever because ON DELETE CASCADE has already removed the
  // only DB references.
  const images = await db
    .select({ url: eventImages.url })
    .from(eventImages)
    .where(eq(eventImages.eventId, id));

  await Promise.all(images.map((img) => deleteImageBlob(img.url)));

  await db.delete(events).where(eq(events.id, id));

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

export async function reorderEvents(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(events).set({ sortOrder: i }).where(eq(events.id, orderedIds[i]));
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

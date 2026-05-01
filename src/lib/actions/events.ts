"use server";

import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/validations/event";

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
    imageUrl: formData.get("imageUrl") || undefined,
  });

  await db.insert(events).values({
    title: parsed.title,
    description: parsed.description ?? null,
    date: parsed.date,
    time: parsed.time ?? null,
    artistName: parsed.artistName ?? null,
    artistUrl: parsed.artistUrl || null,
    imageUrl: parsed.imageUrl || null,
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
    imageUrl: formData.get("imageUrl") || undefined,
  });

  // isPublished is admin metadata, not user input — handled outside Zod.
  // Only included in the SET clause when explicitly provided, so editing an
  // event without flipping its publish state preserves the existing value.
  const isPublishedRaw = formData.get("isPublished");
  const isPublishedUpdate =
    isPublishedRaw === "true"
      ? { isPublished: true }
      : isPublishedRaw === "false"
        ? { isPublished: false }
        : {};

  await db
    .update(events)
    .set({
      title: parsed.title,
      description: parsed.description ?? null,
      date: parsed.date,
      time: parsed.time ?? null,
      artistName: parsed.artistName ?? null,
      artistUrl: parsed.artistUrl || null,
      imageUrl: parsed.imageUrl || null,
      ...isPublishedUpdate,
    })
    .where(eq(events.id, id));

  revalidatePath("/events");
  revalidatePath("/admin/events");
}

export async function deleteEvent(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

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

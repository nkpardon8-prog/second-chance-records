"use server";

import { db } from "@/lib/db";
import { featuredRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordSchema } from "@/lib/validations/record";

export async function getFeaturedRecords(category?: string) {
  if (category) {
    return db
      .select()
      .from(featuredRecords)
      .where(eq(featuredRecords.category, category))
      .orderBy(featuredRecords.sortOrder);
  }
  return db.select().from(featuredRecords).orderBy(featuredRecords.sortOrder);
}

export async function createRecord(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = recordSchema.parse({
    title: formData.get("title"),
    artist: formData.get("artist") || undefined,
    category: formData.get("category"),
    discogsUrl: formData.get("discogsUrl"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
  });

  await db.insert(featuredRecords).values({
    title: parsed.title,
    artist: parsed.artist ?? null,
    category: parsed.category,
    discogsUrl: parsed.discogsUrl,
    imageUrl: parsed.imageUrl || null,
    description: parsed.description ?? null,
  });

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/records");
}

export async function updateRecord(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = recordSchema.parse({
    title: formData.get("title"),
    artist: formData.get("artist") || undefined,
    category: formData.get("category"),
    discogsUrl: formData.get("discogsUrl"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
  });

  await db
    .update(featuredRecords)
    .set({
      title: parsed.title,
      artist: parsed.artist ?? null,
      category: parsed.category,
      discogsUrl: parsed.discogsUrl,
      imageUrl: parsed.imageUrl || null,
      description: parsed.description ?? null,
    })
    .where(eq(featuredRecords.id, id));

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/records");
}

export async function deleteRecord(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(featuredRecords).where(eq(featuredRecords.id, id));

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/records");
}

export async function reorderRecords(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(featuredRecords).set({ sortOrder: i }).where(eq(featuredRecords.id, orderedIds[i]));
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/records");
}

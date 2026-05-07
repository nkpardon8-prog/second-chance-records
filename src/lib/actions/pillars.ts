"use server";

import { db } from "@/lib/db";
import { pillars } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pillarSchema } from "@/lib/validations/pillar";

export async function getPillars() {
  return db.select().from(pillars).orderBy(pillars.sortOrder);
}

export async function createPillar(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = pillarSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    linkUrl: formData.get("linkUrl") || undefined,
    linkLabel: formData.get("linkLabel") || undefined,
  });

  await db.insert(pillars).values({
    title: parsed.title,
    description: parsed.description,
    linkUrl: parsed.linkUrl || null,
    linkLabel: parsed.linkLabel || null,
  });

  revalidatePath("/mission");
  revalidatePath("/admin/pillars");
}

export async function updatePillar(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = pillarSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    linkUrl: formData.get("linkUrl") || undefined,
    linkLabel: formData.get("linkLabel") || undefined,
  });

  await db
    .update(pillars)
    .set({
      title: parsed.title,
      description: parsed.description,
      linkUrl: parsed.linkUrl || null,
      linkLabel: parsed.linkLabel || null,
    })
    .where(eq(pillars.id, id));

  revalidatePath("/mission");
  revalidatePath("/admin/pillars");
}

export async function deletePillar(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(pillars).where(eq(pillars.id, id));

  revalidatePath("/mission");
  revalidatePath("/admin/pillars");
}

"use server";

import { db } from "@/lib/db";
import { pressMentions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pressMentionSchema } from "@/lib/validations/press-mention";

export async function getPressMentions() {
  return db.select().from(pressMentions).orderBy(pressMentions.sortOrder);
}

export async function createPressMention(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = pressMentionSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
  });

  await db.insert(pressMentions).values({
    name: parsed.name,
    url: parsed.url,
  });

  revalidatePath("/about");
  revalidatePath("/admin/press-mentions");
}

export async function updatePressMention(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = pressMentionSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
  });

  await db
    .update(pressMentions)
    .set({
      name: parsed.name,
      url: parsed.url,
    })
    .where(eq(pressMentions.id, id));

  revalidatePath("/about");
  revalidatePath("/admin/press-mentions");
}

export async function deletePressMention(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(pressMentions).where(eq(pressMentions.id, id));

  revalidatePath("/about");
  revalidatePath("/admin/press-mentions");
}

export async function reorderPressMentions(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(pressMentions).set({ sortOrder: i }).where(eq(pressMentions.id, orderedIds[i]));
  }

  revalidatePath("/about");
  revalidatePath("/admin/press-mentions");
}

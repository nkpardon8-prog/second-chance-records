"use server";

import { db } from "@/lib/db";
import { communityResources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { resourceSchema } from "@/lib/validations/resource";

export async function getResources() {
  return db.select().from(communityResources).orderBy(communityResources.sortOrder);
}

export async function createResource(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = resourceSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    description: formData.get("description") || undefined,
  });

  await db.insert(communityResources).values({
    name: parsed.name,
    url: parsed.url,
    description: parsed.description ?? null,
  });

  revalidatePath("/mission");
  revalidatePath("/admin/resources");
}

export async function updateResource(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = resourceSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    description: formData.get("description") || undefined,
  });

  await db
    .update(communityResources)
    .set({
      name: parsed.name,
      url: parsed.url,
      description: parsed.description ?? null,
    })
    .where(eq(communityResources.id, id));

  revalidatePath("/mission");
  revalidatePath("/admin/resources");
}

export async function deleteResource(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(communityResources).where(eq(communityResources.id, id));

  revalidatePath("/mission");
  revalidatePath("/admin/resources");
}

export async function reorderResources(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(communityResources)
      .set({ sortOrder: i })
      .where(eq(communityResources.id, orderedIds[i]));
  }

  revalidatePath("/mission");
  revalidatePath("/admin/resources");
}

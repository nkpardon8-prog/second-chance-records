"use server";

import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { partnerSchema } from "@/lib/validations/partner";

export async function getPartners() {
  return db.select().from(partners).orderBy(partners.sortOrder);
}

export async function createPartner(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = partnerSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    logoUrl: formData.get("logoUrl") || undefined,
    description: formData.get("description") || undefined,
  });

  await db.insert(partners).values({
    name: parsed.name,
    url: parsed.url,
    logoUrl: parsed.logoUrl || null,
    description: parsed.description ?? null,
  });

  revalidatePath("/community");
  revalidatePath("/admin/partners");
}

export async function updatePartner(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = partnerSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    logoUrl: formData.get("logoUrl") || undefined,
    description: formData.get("description") || undefined,
  });

  await db
    .update(partners)
    .set({
      name: parsed.name,
      url: parsed.url,
      logoUrl: parsed.logoUrl || null,
      description: parsed.description ?? null,
    })
    .where(eq(partners.id, id));

  revalidatePath("/community");
  revalidatePath("/admin/partners");
}

export async function deletePartner(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(partners).where(eq(partners.id, id));

  revalidatePath("/community");
  revalidatePath("/admin/partners");
}

export async function reorderPartners(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(partners).set({ sortOrder: i }).where(eq(partners.id, orderedIds[i]));
  }

  revalidatePath("/community");
  revalidatePath("/admin/partners");
}

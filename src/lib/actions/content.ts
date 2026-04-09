"use server";

import { db } from "@/lib/db";
import { pageContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPageContent(pageSlug: string) {
  return db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, pageSlug))
    .orderBy(pageContent.sortOrder);
}

export async function updatePageContent(id: number, content: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db
    .update(pageContent)
    .set({ content })
    .where(eq(pageContent.id, id));

  revalidatePath("/");
}

"use server";

import { db } from "@/lib/db";
import { pageContent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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

  const [row] = await db
    .select({ pageSlug: pageContent.pageSlug })
    .from(pageContent)
    .where(eq(pageContent.id, id))
    .limit(1);

  await db
    .update(pageContent)
    .set({ content })
    .where(eq(pageContent.id, id));

  if (row) {
    revalidatePath(`/${row.pageSlug === "home" ? "" : row.pageSlug}`);
  }
  revalidatePath("/");
}

export async function upsertPageContent(
  pageSlug: string,
  sectionKey: string,
  content: string,
) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const existing = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, pageSlug),
        eq(pageContent.sectionKey, sectionKey),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pageContent)
      .set({ content })
      .where(eq(pageContent.id, existing[0].id));
  } else {
    await db.insert(pageContent).values({ pageSlug, sectionKey, content });
  }

  revalidatePath(`/${pageSlug === "home" ? "" : pageSlug}`);
  revalidatePath("/");
}

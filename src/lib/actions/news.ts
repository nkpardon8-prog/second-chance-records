"use server";

import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { newsSchema } from "@/lib/validations/news";

export async function getNews(publishedOnly?: boolean) {
  if (publishedOnly) {
    return db
      .select()
      .from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt));
  }
  return db.select().from(news).orderBy(desc(news.publishedAt));
}

export async function createNews(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = newsSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl") || undefined,
  });

  await db.insert(news).values({
    title: parsed.title,
    content: parsed.content,
    imageUrl: parsed.imageUrl || null,
  });

  revalidatePath("/");
  revalidatePath("/admin/news");
}

export async function updateNews(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = newsSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl") || undefined,
  });

  await db
    .update(news)
    .set({
      title: parsed.title,
      content: parsed.content,
      imageUrl: parsed.imageUrl || null,
    })
    .where(eq(news.id, id));

  revalidatePath("/");
  revalidatePath("/admin/news");
}

export async function deleteNews(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(news).where(eq(news.id, id));

  revalidatePath("/");
  revalidatePath("/admin/news");
}

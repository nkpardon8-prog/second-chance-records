"use server";

import { db } from "@/lib/db";
import { instagramPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { scrapeInstagramPosts } from "@/lib/apify";
import { uploadFromUrl } from "@/lib/image-store";

export async function getInstagramPosts(limit?: number) {
  const query = db
    .select()
    .from(instagramPosts)
    .where(eq(instagramPosts.isVisible, true))
    .orderBy(desc(instagramPosts.postedAt));

  if (limit) {
    return query.limit(limit);
  }
  return query;
}

export async function togglePostVisibility(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const [post] = await db
    .select()
    .from(instagramPosts)
    .where(eq(instagramPosts.id, id));

  if (!post) throw new Error("Post not found");

  await db
    .update(instagramPosts)
    .set({ isVisible: !post.isVisible })
    .where(eq(instagramPosts.id, id));

  revalidatePath("/");
  revalidatePath("/admin/instagram");
}

export async function triggerSync(): Promise<{ count: number; error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { count: 0, error: "Unauthorized" };

  let scraped;
  try {
    scraped = await scrapeInstagramPosts();
  } catch (err) {
    return {
      count: 0,
      error: `Apify scrape failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!scraped.length) {
    return { count: 0, error: "Apify returned 0 posts" };
  }

  let synced = 0;
  for (const post of scraped) {
    const existing = await db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.instagramId, post.instagramId))
      .then((rows) => rows[0]);
    if (existing) continue;

    let permanentUrl;
    try {
      permanentUrl = await uploadFromUrl(post.imageUrl, post.instagramId);
    } catch (err) {
      console.error(`Image upload failed for ${post.instagramId}:`, err);
      continue;
    }

    await db.insert(instagramPosts).values({
      instagramId: post.instagramId,
      imageUrl: permanentUrl,
      caption: post.caption,
      permalink: post.permalink,
      likesCount: post.likesCount,
      postedAt: new Date(post.postedAt),
    });
    synced++;
  }

  revalidatePath("/");
  revalidatePath("/admin/instagram");

  return { count: synced };
}

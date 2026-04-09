"use server";

import { db } from "@/lib/db";
import { instagramPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  // Trigger the Netlify scheduled function which has a longer timeout
  // and handles the full Apify scrape + image upload + DB insert pipeline
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://second-chance-records.netlify.app";
    const res = await fetch(`${siteUrl}/.netlify/functions/sync-instagram`, {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text();
      return { count: 0, error: `Sync function failed: ${res.status} ${text}` };
    }

    const text = await res.text();
    // Parse "Fetched X posts, synced Y new" from the response
    const match = text.match(/synced (\d+) new/);
    const count = match ? parseInt(match[1], 10) : 0;

    revalidatePath("/");
    revalidatePath("/admin/instagram");

    return { count };
  } catch (err) {
    return {
      count: 0,
      error: `Sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

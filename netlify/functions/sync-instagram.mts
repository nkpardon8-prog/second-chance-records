// NOTE: All logic inlined — Netlify Functions bundle independently from Next.js.
import type { Config } from "@netlify/functions";
import { ApifyClient } from "apify-client";
import { getStore } from "@netlify/blobs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Inline schema (just instagram_posts table)
const instagramPosts = pgTable("instagram_posts", {
  id: serial("id").primaryKey(),
  instagramId: varchar("instagram_id", { length: 100 }).notNull().unique(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  permalink: text("permalink").notNull(),
  likesCount: integer("likes_count").default(0),
  postedAt: timestamp("posted_at").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  isVisible: boolean("is_visible").notNull().default(true),
});

// Zod schema to validate Apify response items
const apifyPostSchema = z.object({
  shortCode: z.string(),
  displayUrl: z.string().url(),
  caption: z.string().optional().default(""),
  url: z.string().url(),
  likesCount: z.number().optional().default(0),
  timestamp: z.string(),
});

export default async function handler() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  // Scrape Instagram
  const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });
  const run = await apify.actor("apify/instagram-scraper").call({
    directUrls: ["https://www.instagram.com/second_chance_recordspdx/"],
    resultsType: "posts",
    resultsLimit: 20,
  });
  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  // Set up Netlify Blobs store for image hosting
  const imageStore = getStore({ name: "images", consistency: "strong" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://secondchancerecords.com";

  let synced = 0;
  for (const rawItem of items) {
    const parsed = apifyPostSchema.safeParse(rawItem);
    if (!parsed.success) continue;
    const post = parsed.data;

    // Skip if already synced
    const existing = await db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.instagramId, post.shortCode))
      .then((rows) => rows[0]);
    if (existing) continue;

    // Download from IG CDN -> store in Netlify Blobs for permanent URL
    const imageResponse = await fetch(post.displayUrl);
    if (!imageResponse.ok) continue;
    const imageBuffer = await imageResponse.arrayBuffer();

    const blobKey = post.shortCode;
    await imageStore.set(blobKey, imageBuffer as ArrayBuffer, {
      metadata: {
        sourceUrl: post.displayUrl,
        uploadedAt: new Date().toISOString(),
      },
    });

    const permanentUrl = `${siteUrl}/api/images/${blobKey}`;

    await db.insert(instagramPosts).values({
      instagramId: post.shortCode,
      imageUrl: permanentUrl,
      caption: post.caption,
      permalink: post.url,
      likesCount: post.likesCount,
      postedAt: new Date(post.timestamp),
    });
    synced++;
  }

  return new Response(`Fetched ${items.length} posts, synced ${synced} new`);
}

export const config: Config = { schedule: "0 9 * * *" };

import { ApifyClient } from "apify-client";
import { z } from "zod";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });

const instagramItemSchema = z.object({
  shortCode: z.string(),
  displayUrl: z.string().url(),
  caption: z.string().optional().default(""),
  url: z.string().url(),
  likesCount: z.number().optional().default(0),
  timestamp: z.string(),
});

export interface ScrapedPost {
  instagramId: string;
  imageUrl: string;
  caption: string;
  permalink: string;
  likesCount: number;
  postedAt: string;
}

export async function scrapeInstagramPosts(limit = 20): Promise<ScrapedPost[]> {
  const run = await client.actor("apify/instagram-scraper").call({
    directUrls: ["https://www.instagram.com/second_chance_recordspdx/"],
    resultsType: "posts",
    resultsLimit: limit,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const posts: ScrapedPost[] = [];
  for (const item of items) {
    const parsed = instagramItemSchema.safeParse(item);
    if (!parsed.success) continue;
    posts.push({
      instagramId: parsed.data.shortCode,
      imageUrl: parsed.data.displayUrl,
      caption: parsed.data.caption,
      permalink: parsed.data.url,
      likesCount: parsed.data.likesCount,
      postedAt: parsed.data.timestamp,
    });
  }

  return posts;
}

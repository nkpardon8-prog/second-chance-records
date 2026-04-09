import { z } from "zod";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const APIFY_BASE = "https://api.apify.com/v2";

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

export async function scrapeInstagramPosts(
  limit = 20,
): Promise<ScrapedPost[]> {
  // Start the actor run and wait for it to finish (waitForFinish in seconds)
  const runRes = await fetch(
    `${APIFY_BASE}/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}&waitForFinish=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls: [
          "https://www.instagram.com/second_chance_recordspdx/",
        ],
        resultsType: "posts",
        resultsLimit: limit,
      }),
    },
  );

  if (!runRes.ok) {
    throw new Error(`Apify run failed: ${runRes.status} ${await runRes.text()}`);
  }

  const runData = await runRes.json();
  const status = runData.data?.status;

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run finished with status: ${status}`);
  }

  // Fetch dataset items
  const datasetId = runData.data?.defaultDatasetId;
  const itemsRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}`,
  );
  const items = await itemsRes.json();

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

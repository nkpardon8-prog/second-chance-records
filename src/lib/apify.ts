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
  // Start the actor run via REST API (avoids apify-client bundling issues)
  const runRes = await fetch(
    `${APIFY_BASE}/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`,
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
    throw new Error(`Apify run start failed: ${runRes.status} ${await runRes.text()}`);
  }

  const runData = await runRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  // Wait for the run to finish (poll every 5 seconds)
  let status = runData.data?.status;
  while (status === "RUNNING" || status === "READY") {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`,
    );
    const pollData = await pollRes.json();
    status = pollData.data?.status;
  }

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

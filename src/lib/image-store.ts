import { getStore } from "@netlify/blobs";

/**
 * Downloads an image from a URL and stores it in Netlify Blobs.
 * Returns the permanent URL served via our /api/images/[key] route.
 */
export async function uploadFromUrl(imageUrl: string, key: string): Promise<string> {
  const store = getStore({ name: "images", consistency: "strong" });

  // Check if already uploaded
  const existing = await store.getMetadata(key).catch(() => null);
  if (existing) {
    return getImageUrl(key);
  }

  // Download image from source URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const imageBuffer = await response.arrayBuffer();

  // Store in Netlify Blobs
  await store.set(key, imageBuffer as ArrayBuffer, {
    metadata: {
      sourceUrl: imageUrl,
      uploadedAt: new Date().toISOString(),
    },
  });

  return getImageUrl(key);
}

/**
 * Returns the URL for a stored image, served via our API route.
 */
export function getImageUrl(key: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://secondchancerecords.com";
  return `${siteUrl}/api/images/${key}`;
}

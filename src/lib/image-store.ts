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
 * Stores an in-memory image buffer in Netlify Blobs with content-type metadata.
 * Used for admin uploads where the file already lives in the request, not on a remote URL.
 */
export async function uploadFromBuffer(
  buffer: ArrayBuffer,
  contentType: string,
  key: string,
): Promise<string> {
  const store = getStore({ name: "images", consistency: "strong" });

  const existing = await store.getMetadata(key).catch(() => null);
  if (existing) {
    return getImageUrl(key);
  }

  await store.set(key, buffer, {
    metadata: {
      contentType,
      uploadedAt: new Date().toISOString(),
    },
  });

  return getImageUrl(key);
}

/**
 * Returns the URL for a stored image, served via our API route.
 * Normalizes the configured site URL (via new URL().origin) so a trailing slash
 * in env doesn't produce a `//api/images/...` path.
 */
export function getImageUrl(key: string): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://secondchancerecords.com";
  let origin: string;
  try {
    origin = new URL(rawSiteUrl).origin;
  } catch {
    origin = "https://secondchancerecords.com";
  }
  const safeKey = key.split("/").map(encodeURIComponent).join("/");
  return `${origin}/api/images/${safeKey}`;
}

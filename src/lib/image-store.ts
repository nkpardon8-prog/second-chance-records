import { getStore } from "@netlify/blobs";

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
 * Resolves OUR canonical origin from NEXT_PUBLIC_SITE_URL, falling back to the
 * production hostname. Used to bind both URL emission and URL validation to
 * the same origin so the two can never drift.
 */
function ourOrigin(): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://secondchancerecords.com";
  try {
    return new URL(rawSiteUrl).origin;
  } catch {
    return "https://secondchancerecords.com";
  }
}

/**
 * Returns the URL for a stored image, served via our API route.
 * Normalizes the configured site URL (via new URL().origin) so a trailing slash
 * in env doesn't produce a `//api/images/...` path.
 */
export function getImageUrl(key: string): string {
  const safeKey = key.split("/").map(encodeURIComponent).join("/");
  return `${ourOrigin()}/api/images/${safeKey}`;
}

/**
 * Extracts the blob key from a /api/images/<key> URL produced by getImageUrl().
 * Returns null if the URL isn't one of ours (defensive — never delete random blobs).
 *
 * Origin is asserted: a foreign URL like https://evil.com/api/images/events/x.jpg
 * has the matching pathname but a different origin, and would otherwise pass the
 * prefix check. Without the origin assert, an authenticated admin could store an
 * arbitrary URL under our events/ prefix and bypass downstream gates.
 */
export function keyFromImageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.origin !== ourOrigin()) return null;
    const prefix = "/api/images/";
    if (!u.pathname.startsWith(prefix)) return null;
    const encoded = u.pathname.slice(prefix.length);
    return encoded.split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

/**
 * Deletes a stored blob by its public URL. No-op if the URL isn't ours or the
 * blob doesn't exist — never throws on missing keys, since cleanup is best-effort.
 */
export async function deleteImageBlob(url: string): Promise<void> {
  const key = keyFromImageUrl(url);
  if (!key) return;
  const store = getStore({ name: "images", consistency: "strong" });
  await store.delete(key).catch(() => undefined);
}

import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const joined = key.join("/");
  const store = getStore({ name: "images", consistency: "strong" });
  const blob = await store.get(joined, { type: "arrayBuffer" });

  if (!blob) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Legacy Instagram blobs were stored without contentType metadata; fall back
  // to image/jpeg for those. New admin uploads write contentType in metadata.
  const meta = await store.getMetadata(joined).catch(() => null);
  const metadata = meta?.metadata as { contentType?: string } | undefined;
  const stored = metadata?.contentType ?? "image/jpeg";

  // Hard-allowlist on the GET side: even if a future code path stamps a non-image
  // contentType into blob metadata, we refuse to serve it as anything but an
  // image. Combined with X-Content-Type-Options: nosniff this prevents a stored
  // blob from ever being interpreted as HTML/JS by the browser.
  const contentType = stored.startsWith("image/") ? stored : "image/jpeg";

  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

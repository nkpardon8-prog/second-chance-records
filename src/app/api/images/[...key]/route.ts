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
  const stored = (metadata?.contentType ?? "image/jpeg").toLowerCase().split(";")[0].trim();

  // Hard-allowlist on the GET side. SVG is an image MIME type but renders as a
  // top-level HTML/JS document when navigated to directly, so it's deliberately
  // excluded — even though the upload route's signature sniff already rejects
  // it. Combined with X-Content-Type-Options: nosniff this means a stored blob
  // can never be interpreted as HTML/JS by the browser regardless of how it
  // got into the store.
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const contentType = ALLOWED_TYPES.includes(stored) ? stored : "image/jpeg";

  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const store = getStore({ name: "images", consistency: "strong" });
  const blob = await store.get(key, { type: "arrayBuffer" });

  if (!blob) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

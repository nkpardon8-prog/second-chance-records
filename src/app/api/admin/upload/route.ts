import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFromBuffer } from "@/lib/image-store";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

// Browser-supplied file.type is spoofable, so we sniff the leading bytes for
// real signatures. Polyglot files renamed with a fake extension also fail here.
const SIGNATURES: Array<{ ext: string; contentType: string; bytes: number[] }> = [
  { ext: "jpg", contentType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { ext: "png", contentType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: "gif", contentType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: "webp", contentType: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

function detectImage(bytes: Uint8Array): { ext: string; contentType: string } | null {
  for (const sig of SIGNATURES) {
    if (bytes.length < sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    // RIFF containers cover several formats. Confirm WEBP via the WEBP marker.
    if (sig.ext === "webp") {
      if (bytes.length < 12 || String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") {
        continue;
      }
    }
    return { ext: sig.ext, contentType: sig.contentType };
  }
  return null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://secondchancerecords.com";
  if (origin && origin !== siteUrl) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 12));
  const detected = detectImage(head);
  if (!detected) {
    return NextResponse.json({ error: "Unsupported or corrupt image" }, { status: 415 });
  }

  // Hardcoded folder — no client-controlled path component. New folders
  // require a new typed route or server-side allowlist.
  const folder = "events";
  const key = `${folder}/${randomUUID()}.${detected.ext}`;
  const url = await uploadFromBuffer(buffer, detected.contentType, key);

  return NextResponse.json({ url, key });
}

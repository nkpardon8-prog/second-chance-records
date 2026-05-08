import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFromBuffer } from "@/lib/image-store";
import { processImage } from "@/lib/image-processing";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

// Allowlist of folder prefixes the admin can upload into. Each downstream
// feature owns one prefix so blob deletion gates can scope safely.
const ALLOWED_FOLDERS = ["events", "news", "partners", "swag"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];
const DEFAULT_FOLDER: AllowedFolder = "events";

function pickFolder(formData: FormData): AllowedFolder {
  const raw = formData.get("folder");
  if (typeof raw === "string" && (ALLOWED_FOLDERS as readonly string[]).includes(raw)) {
    return raw as AllowedFolder;
  }
  return DEFAULT_FOLDER;
}

// CSRF defense in depth: ensure the request's Origin (or Referer fallback)
// hostname matches the host the user actually browsed to. We compare against
// the Host / X-Forwarded-Host header (set by the browser / preserved by the
// edge proxy) rather than request.nextUrl.origin, because on Netlify the
// internal request URL isn't the same as the public-facing host. Comparing
// hostnames sidesteps protocol/port noise and works on apex, www, and any
// Netlify preview URL automatically. Same-site cookies are sameSite=lax so
// for POST requests this is purely belt-and-suspenders.
function originAllowed(request: NextRequest): boolean {
  const ownHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!ownHost) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === ownHost;
    } catch {
      return false;
    }
  }

  // Fallback: Origin can legitimately be absent. Require Referer host match.
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).host === ownHost;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reject oversized uploads BEFORE buffering the body via formData(). Without
  // this an attacker (or a misbehaving client) could push multi-GB multipart
  // bodies into memory before the file.size check fires.
  //
  // Content-Length includes multipart framing (boundary lines, per-part headers,
  // CRLFs) on top of the file bytes, so the precheck must allow some envelope
  // headroom. Without it, legitimate files just under MAX_BYTES are rejected
  // here even though the actual file would pass the post-parse check below.
  // The post-parse `file.size > MAX_BYTES` check still enforces the true cap.
  const PREPARSE_LIMIT = MAX_BYTES + 16 * 1024;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > PREPARSE_LIMIT) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = pickFolder(formData);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const inputBuffer = await file.arrayBuffer();

  // Process: validate structure, cap decoded pixels, resize, re-encode to webp,
  // strip EXIF. sharp throws on malformed / non-image input, on oversized
  // pixel counts, and decodes HEIC natively — so this single call replaces
  // the prior magic-byte sniff plus handles iPhone photos transparently.
  let processed;
  try {
    processed = await processImage(inputBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Friendly hint for the most common failure modes.
    if (/unsupported image format|Input file contains unsupported image format/i.test(message)) {
      return NextResponse.json(
        { error: "Unsupported image format. Try JPG, PNG, WEBP, GIF, or HEIC." },
        { status: 415 },
      );
    }
    if (/limitInputPixels|Input image exceeds pixel limit/i.test(message)) {
      return NextResponse.json(
        { error: "Image dimensions are too large. Please resize before uploading." },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { error: "Could not process image. The file may be corrupt." },
      { status: 415 },
    );
  }

  // Hardcoded folder allowlist — no client-controlled path component beyond
  // the validated short string above. New folders require a code change.
  const key = `${folder}/${randomUUID()}.${processed.ext}`;
  const url = await uploadFromBuffer(processed.buffer, processed.contentType, key);

  return NextResponse.json({ url, key });
}

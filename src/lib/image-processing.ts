import sharp from "sharp";
import decodeHeic from "heic-decode";

/**
 * Server-side image post-processing for admin uploads.
 *
 * Every uploaded image flows through this pipeline:
 *
 *   1. Validate structure (sharp throws on malformed / non-image input).
 *   2. Cap decoded size (limitInputPixels) — defangs JPEG/PNG bombs that
 *      claim to be 50000×50000.
 *   3. Resize to MAX_DIMENSION on the long edge, preserving aspect, never
 *      enlarging.
 *   4. Re-encode to webp (or gif if the source was an animated gif) at a
 *      sane quality. Sharp drops EXIF/IPTC/XMP by default, so this also
 *      strips GPS / device / capture metadata that came off Tasha's phone.
 *   5. Polyglot files (e.g. HTML+JPEG) come out as a clean re-encoded image
 *      because sharp only emits the decoded pixels, not the source bytes.
 *
 * HEIC support: sharp's prebuilt Linux binaries don't include libheif
 * (HEVC patent licensing), so we detect HEIC by ftyp box magic bytes and
 * decode separately via the pure-JS `heic-decode` package, then hand the
 * raw RGBA pixels to sharp for resize + webp encode. The output is always
 * webp, so callers don't need to know HEIC was involved.
 */

const MAX_DIMENSION = 2000;
const MAX_INPUT_PIXELS = 50_000_000; // 50 megapixels
const WEBP_QUALITY = 80;

export interface ProcessedImage {
  /** The encoded image as an ArrayBuffer (matches what @netlify/blobs accepts). */
  buffer: ArrayBuffer;
  contentType: string;
  ext: string;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  // Buffer is a Uint8Array view over an ArrayBuffer; slice the relevant range
  // so we don't carry along surrounding pool memory.
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * HEIF/HEIC files start with a `ftyp` box at offset 4. The brand at offset 8
 * tells us what flavor (heic = HEVC still, mif1 = HEIF base, etc.). Apple's
 * iOS camera roll uses heic / heix / heim / heis depending on capture mode.
 */
function isHeic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return [
    "heic", "heix", "hevc", "hevx",
    "heim", "heis", "hevm", "hevs",
    "mif1", "msf1",
  ].includes(brand);
}

export async function processImage(input: ArrayBuffer): Promise<ProcessedImage> {
  const inputBuffer = Buffer.from(input);

  // HEIC fast-path: decode via heic-decode (pure JS) into raw RGBA, then hand
  // the pixels to sharp for resize + webp encode. Avoids sharp's missing
  // libheif binding on Netlify's Linux runtime.
  if (isHeic(inputBuffer)) {
    const decoded = await decodeHeic({ buffer: new Uint8Array(inputBuffer) });
    let pipeline = sharp(Buffer.from(decoded.data), {
      raw: { width: decoded.width, height: decoded.height, channels: 4 },
      limitInputPixels: MAX_INPUT_PIXELS,
    });
    if (decoded.width > MAX_DIMENSION || decoded.height > MAX_DIMENSION) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const buf = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
    return { buffer: toArrayBuffer(buf), contentType: "image/webp", ext: "webp" };
  }

  let pipeline = sharp(inputBuffer, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  });

  const meta = await pipeline.metadata();

  if (
    (meta.width && meta.width > MAX_DIMENSION) ||
    (meta.height && meta.height > MAX_DIMENSION)
  ) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Animated GIFs lose their animation if re-encoded to webp without
  // animated:true. Keep them as gif to preserve the animation; static gifs
  // would also work as webp but the savings are marginal so we don't bother.
  if (meta.format === "gif" && (meta.pages ?? 1) > 1) {
    const buf = await pipeline.gif().toBuffer();
    return { buffer: toArrayBuffer(buf), contentType: "image/gif", ext: "gif" };
  }

  const buf = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
  return { buffer: toArrayBuffer(buf), contentType: "image/webp", ext: "webp" };
}

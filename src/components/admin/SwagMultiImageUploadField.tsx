"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageLightbox from "@/components/ui/ImageLightbox";
import {
  addSwagImage,
  removeSwagImage,
  reorderSwagImages,
  deleteOrphanSwagBlob,
} from "@/lib/actions/shop-swag";
import { keyFromImageUrl } from "@/lib/image-store";
import type { ShopSwagImage } from "@/types";

const SWAG_IMAGE_KEY_PREFIX = "swag/";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  itemId: number;
  images: ShopSwagImage[];
  label: string;
}

export default function SwagMultiImageUploadField({ itemId, images, label }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // No local "draft" state — items mirror the prop. Server actions revalidate
  // the route; router.refresh() then pulls the new RSC payload so the parent
  // server component re-renders and feeds new images back through props.
  // (revalidatePath alone invalidates the cache for next navigation but does
  // NOT auto-trigger a re-render of the currently-mounted client tree when
  // the action was awaited from a client handler rather than a <form action>.)
  //
  // Defense in depth: filter out any row whose URL doesn't decode to one of
  // our own /api/images/swag/* keys. SwagGrid applies the same filter on
  // the public render path; mirroring it here means a stored bad row (legacy
  // data, schema accident) can never produce a clickable cross-origin link in
  // the admin gallery either.
  const items = images.filter((img) => {
    const key = keyFromImageUrl(img.url);
    return key !== null && key.startsWith(SWAG_IMAGE_KEY_PREFIX);
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      e.target.value = "";
      return;
    }
    if (items.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images per item`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    let uploadedUrl: string | null = null;
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", "swag");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      uploadedUrl = json.url;
      await addSwagImage(itemId, json.url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      // If blob upload SUCCEEDED but addSwagImage FAILED (cap race, session
      // drop, etc), the blob is now orphaned with no row pointing at it —
      // deleteSwagItem's cleanup logic can never find it. Fire-and-forget cleanup.
      if (uploadedUrl) {
        deleteOrphanSwagBlob(uploadedUrl).catch(() => undefined);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleRemove(imageId: number) {
    setError(null);
    startTransition(async () => {
      try {
        await removeSwagImage(imageId, itemId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Remove failed");
      }
    });
  }

  function reorder(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setError(null);
    startTransition(async () => {
      try {
        await reorderSwagImages(itemId, next.map((i) => i.id));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Reorder failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-mono uppercase text-xs tracking-wider text-cream">
          {label}
        </label>
        <span className="text-xs text-kraft/70">
          {items.length} / {MAX_IMAGES}
        </span>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {items.map((img, index) => (
            <div
              key={img.id}
              className="relative bg-base border border-white/10 rounded-sm overflow-hidden h-32 flex items-center justify-center"
            >
              <ImageLightbox
                src={img.url}
                alt=""
                thumbnailClassName="w-full h-full"
                imgClassName=""
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={pending}
                aria-label="Remove image"
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-base/80 text-cream hover:bg-brick text-xs disabled:opacity-50 z-10"
              >
                &#10005;
              </button>
              <div className="absolute bottom-1 left-1 flex flex-col gap-0.5 z-10">
                <button
                  type="button"
                  onClick={() => reorder(index, index - 1)}
                  disabled={index === 0 || pending}
                  aria-label="Move up"
                  className="w-5 h-5 flex items-center justify-center rounded-sm bg-base/80 text-cream disabled:opacity-30 text-xs"
                >&#9650;</button>
                <button
                  type="button"
                  onClick={() => reorder(index, index + 1)}
                  disabled={index === items.length - 1 || pending}
                  aria-label="Move down"
                  className="w-5 h-5 flex items-center justify-center rounded-sm bg-base/80 text-cream disabled:opacity-30 text-xs"
                >&#9660;</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/*
          Native <label htmlFor> + sr-only input opens the file picker via
          HTML, not via fileInputRef.current.click(). Some browsers refuse to
          open a file dialog when the input is display:none and the click is
          programmatic; this pattern sidesteps both gotchas.
        */}
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          onChange={handleFile}
          disabled={uploading || items.length >= MAX_IMAGES}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          aria-disabled={uploading || items.length >= MAX_IMAGES}
          className={`rounded-sm transition-colors duration-200 inline-flex items-center justify-center bg-brick text-cream hover:bg-brick/90 font-mono uppercase text-sm tracking-wider px-3 py-1.5 text-xs cursor-pointer ${uploading || items.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
        >
          {uploading ? "Uploading…" : "Upload Image"}
        </label>
        {items.length >= MAX_IMAGES && (
          <span className="text-xs text-kraft/70">
            Max reached. Remove one to add another.
          </span>
        )}
      </div>

      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}

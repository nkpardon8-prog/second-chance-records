"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ui/ImageLightbox";
import {
  addEventImage,
  removeEventImage,
  reorderEventImages,
  deleteOrphanBlob,
} from "@/lib/actions/event-images";
import type { EventImage } from "@/types";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  eventId: number;
  images: EventImage[];
  label: string;
}

export default function MultiImageUploadField({ eventId, images, label }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const items = images;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const filename = (file.name || "").toLowerCase();
    if (filename.endsWith(".heic") || filename.endsWith(".heif")) {
      setError("iPhone HEIC photos aren't supported. Please export the photo as JPG before uploading.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      e.target.value = "";
      return;
    }
    if (items.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images per event`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    let uploadedUrl: string | null = null;
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      uploadedUrl = json.url;
      await addEventImage(eventId, json.url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      // If blob upload SUCCEEDED but addEventImage FAILED (cap race, session
      // drop, etc), the blob is now orphaned with no row pointing at it —
      // deleteEvent's cleanup logic can never find it. Fire-and-forget cleanup.
      if (uploadedUrl) {
        deleteOrphanBlob(uploadedUrl).catch(() => undefined);
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
        await removeEventImage(imageId);
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
        await reorderEventImages(eventId, next.map((i) => i.id));
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          disabled={uploading || items.length >= MAX_IMAGES}
          className="hidden"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || items.length >= MAX_IMAGES}
        >
          {uploading ? "Uploading…" : "Upload Image"}
        </Button>
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

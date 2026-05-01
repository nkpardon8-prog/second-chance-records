"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Which blob folder this upload lands under. Validated server-side. */
  folder?: "events" | "news" | "partners";
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUploadField({ label, value, onChange, folder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (folder) fd.set("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono uppercase text-xs tracking-wider text-cream">
        {label}
      </label>
      {value && (
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 rounded-sm border border-white/10 overflow-hidden bg-base flex items-center justify-center">
            <ImageLightbox
              src={value}
              alt={label}
              thumbnailClassName="w-full h-full"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
          >
            Remove
          </Button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={handleFile}
        disabled={uploading}
        className="hidden"
      />
      <div>
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Replace Image" : "Upload Image"}
        </Button>
      </div>
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}

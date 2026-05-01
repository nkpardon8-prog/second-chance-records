"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ label, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-20 w-20 object-cover rounded-sm border border-white/10"
          />
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
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        disabled={uploading}
        className="text-xs text-cream"
      />
      {uploading && <span className="text-xs text-kraft/70">Uploading…</span>}
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}

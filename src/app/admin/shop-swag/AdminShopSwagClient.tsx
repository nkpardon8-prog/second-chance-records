"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  createSwagItem,
  updateSwagItem,
  deleteSwagItem,
  reorderSwagItems,
  addSwagImage,
} from "@/lib/actions/shop-swag";
import SwagMultiImageUploadField from "@/components/admin/SwagMultiImageUploadField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type { ShopSwagItemWithImages } from "@/types";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface AdminShopSwagClientProps {
  items: ShopSwagItemWithImages[];
}

export default function AdminShopSwagClient({ items }: AdminShopSwagClientProps) {
  // Track the editing target by id so the Edit panel re-derives from the
  // latest items prop after every revalidate (keeps the embedded image
  // counter live without a reload).
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = editingId === null ? null : items.find((i) => i.id === editingId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Shop Swag</h2>
        <Button
          size="sm"
          onClick={() => {
            setShowAdd(!showAdd);
            setEditingId(null);
          }}
        >
          {showAdd ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {showAdd && <AddItemPanel onDone={() => setShowAdd(false)} />}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Item</h3>
          <form
            action={(fd) => {
              startTransition(async () => {
                await updateSwagItem(editing.id, fd);
                setEditingId(null);
              });
            }}
            className="flex flex-col gap-3"
          >
            <Input
              name="name"
              label="Name"
              required
              dark
              defaultValue={editing.name}
            />
            <Textarea
              name="description"
              label="Description"
              dark
              defaultValue={editing.description ?? ""}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Update Item
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <SwagMultiImageUploadField
              itemId={editing.id}
              images={editing.images}
              label="Images"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-card border border-white/5 rounded-sm p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-cream truncate">{item.name}</p>
              <p className="text-xs text-kraft/70">
                {item.images.length} image{item.images.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = [...items];
                  if (index === 0) return;
                  [next[index], next[index - 1]] = [next[index - 1], next[index]];
                  startTransition(async () => {
                    await reorderSwagItems(next.map((i) => i.id));
                  });
                }}
                disabled={pending || index === 0}
                aria-label="Move up"
              >
                &#9650;
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = [...items];
                  if (index === items.length - 1) return;
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  startTransition(async () => {
                    await reorderSwagItems(next.map((i) => i.id));
                  });
                }}
                disabled={pending || index === items.length - 1}
                aria-label="Move down"
              >
                &#9660;
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(item.id);
                  setShowAdd(false);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
                onClick={() => {
                  startTransition(async () => {
                    await deleteSwagItem(item.id);
                    if (editingId === item.id) setEditingId(null);
                  });
                }}
                disabled={pending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-kraft/70 text-center py-8">
            No swag items yet. Click &quot;Add Item&quot; to create your first one.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Single-form "create item with photos in one go" panel.
 *
 * Photos are buffered client-side (File objects + object-URL previews) and
 * only sent to the server on submit. Submit flow: createSwagItem to get the
 * new id, then for each buffered file POST /api/admin/upload + addSwagImage.
 * Partial failures during photo upload are surfaced as a tally — the item
 * still exists with whatever photos succeeded; user can edit to retry.
 */
function AddItemPanel({ onDone }: { onDone: () => void }) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Generate stable preview URLs that get revoked when files change/unmount,
  // so we don't leak object URLs.
  const previews = useMemo(
    () => pendingFiles.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) })),
    [pendingFiles],
  );
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!incoming.length) return;
    setError(null);

    const room = MAX_IMAGES - pendingFiles.length;
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of incoming.slice(0, room)) {
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name} too large (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }
      accepted.push(file);
    }
    if (incoming.length > room) {
      rejected.push(`${incoming.length - room} skipped — max ${MAX_IMAGES} per item`);
    }
    if (rejected.length > 0) setError(rejected.join(" · "));
    if (accepted.length > 0) setPendingFiles((prev) => [...prev, ...accepted]);
  }

  function removePending(idx: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(fd: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      const newId = await createSwagItem(fd);

      // Upload buffered files in order. Track failures but keep going so the
      // user gets as many photos through as possible on a flaky network.
      const failures: string[] = [];
      for (const file of pendingFiles) {
        try {
          const upload = new FormData();
          upload.set("file", file);
          upload.set("folder", "swag");
          const res = await fetch("/api/admin/upload", { method: "POST", body: upload });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Upload failed");
          await addSwagImage(newId, json.url);
        } catch (err) {
          failures.push(`${file.name}: ${err instanceof Error ? err.message : "failed"}`);
        }
      }

      if (failures.length === 0) {
        onDone();
      } else {
        setError(
          `Item saved. ${pendingFiles.length - failures.length} of ${pendingFiles.length} photos uploaded. Click Edit on the item to retry: ${failures.join("; ")}`,
        );
        // Don't auto-close so the user can read the message and act on it.
        // They can still hit Cancel to dismiss, and the item already exists.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
      <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Item</h3>
      <form action={handleSubmit} className="flex flex-col gap-3">
        <Input name="name" label="Name" required dark />
        <Textarea name="description" label="Description" dark />

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <label className="font-mono uppercase text-xs tracking-wider text-cream">
              Images
            </label>
            <span className="text-xs text-kraft/70">
              {pendingFiles.length} / {MAX_IMAGES}
            </span>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {previews.map((p, idx) => (
                <div
                  key={p.url}
                  className="relative bg-base border border-white/10 rounded-sm overflow-hidden h-32 flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(idx)}
                    disabled={submitting}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-base/80 text-cream hover:bg-brick text-xs disabled:opacity-50 z-10"
                  >
                    &#10005;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/*
            Native <label htmlFor> + sr-only input opens the file picker via
            HTML, not via fileInputRef.current.click() — sidesteps browser
            gotchas where display:none + programmatic .click() refuses to
            show the dialog.
          */}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            multiple
            onChange={handleFiles}
            disabled={submitting || pendingFiles.length >= MAX_IMAGES}
            className="sr-only"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={inputId}
              aria-disabled={submitting || pendingFiles.length >= MAX_IMAGES}
              className={`rounded-sm transition-colors duration-200 inline-flex items-center justify-center text-cream hover:text-brick font-mono uppercase text-sm tracking-wider px-3 py-1.5 text-xs cursor-pointer ${submitting || pendingFiles.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
            >
              Add Photos
            </label>
            {pendingFiles.length === 0 && (
              <span className="text-xs text-kraft/70">
                Optional — you can also add photos after saving.
              </span>
            )}
            {pendingFiles.length >= MAX_IMAGES && (
              <span className="text-xs text-kraft/70">
                Max reached. Remove one to add another.
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting
              ? "Saving…"
              : pendingFiles.length === 0
                ? "Create Item"
                : `Create Item with ${pendingFiles.length} ${pendingFiles.length === 1 ? "Photo" : "Photos"}`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDone}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>

        {error && <span className="text-xs text-brick">{error}</span>}
      </form>
    </div>
  );
}

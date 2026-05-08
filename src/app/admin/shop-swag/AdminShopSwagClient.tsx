"use client";

import { useState, useTransition } from "react";
import {
  createSwagItem,
  updateSwagItem,
  deleteSwagItem,
  reorderSwagItems,
} from "@/lib/actions/shop-swag";
import SwagMultiImageUploadField from "@/components/admin/SwagMultiImageUploadField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type { ShopSwagItemWithImages } from "@/types";

interface AdminShopSwagClientProps {
  items: ShopSwagItemWithImages[];
}

export default function AdminShopSwagClient({ items }: AdminShopSwagClientProps) {
  // Track the editing target by id, not by object snapshot, so the Edit panel
  // re-derives from the latest `items` prop after every revalidate. Without
  // this, the embedded SwagMultiImageUploadField shows a stale image count
  // after each upload until the user reloads.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = editingId === null ? null : items.find((i) => i.id === editingId) ?? null;

  function handleReorder(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      await reorderSwagItems(next.map((i) => i.id));
    });
  }

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

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Item</h3>
          <form
            action={(fd) => {
              startTransition(async () => {
                // createSwagItem returns the new id; hop straight into the
                // Edit panel so the user can upload images without a separate
                // click. revalidatePath inside the action refreshes `items`
                // so the derived `editing` resolves on the next render.
                const newId = await createSwagItem(fd);
                setShowAdd(false);
                setEditingId(newId);
              });
            }}
            className="flex flex-col gap-3"
          >
            <Input name="name" label="Name" required dark />
            <Textarea name="description" label="Description" dark />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Create Item
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

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
                onClick={() => handleReorder(index, -1)}
                disabled={pending || index === 0}
                aria-label="Move up"
              >
                &#9650;
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReorder(index, 1)}
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

"use client";

import { useState, useTransition, type ReactNode } from "react";
import Button from "@/components/ui/Button";

interface SortableItem {
  id: number;
  [key: string]: unknown;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  onReorder: (orderedIds: number[]) => Promise<void>;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
}

export default function SortableList<T extends SortableItem>({
  items: initialItems,
  renderItem,
  onReorder,
  onEdit,
  onDelete,
}: SortableListProps<T>) {
  // `draft` holds the user's in-progress reordering. When null, we render the
  // server-pushed `initialItems` directly — so add/edit/delete from server
  // actions are reflected immediately without needing a manual page refresh.
  const [draft, setDraft] = useState<T[] | null>(null);
  const [pending, startTransition] = useTransition();
  const items = draft ?? initialItems;
  const dirty = draft !== null;

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setDraft(next);
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setDraft(next);
  }

  function saveOrder() {
    if (!draft) return;
    startTransition(async () => {
      await onReorder(draft.map((i) => i.id));
      setDraft(null);
    });
  }

  return (
    <div className="space-y-2">
      {dirty && (
        <div className="flex justify-end mb-2">
          <Button size="sm" onClick={saveOrder} disabled={pending}>
            {pending ? "Saving..." : "Save Order"}
          </Button>
        </div>
      )}
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 bg-card border border-white/5 rounded-sm p-3"
        >
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="text-brick hover:text-brick/80 disabled:opacity-30 text-xs leading-none"
              aria-label="Move up"
            >
              &#9650;
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === items.length - 1}
              className="text-brick hover:text-brick/80 disabled:opacity-30 text-xs leading-none"
              aria-label="Move down"
            >
              &#9660;
            </button>
          </div>
          <div className="flex-1 min-w-0">{renderItem(item)}</div>
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-kraft/70 text-center py-8">No items yet.</p>
      )}
    </div>
  );
}

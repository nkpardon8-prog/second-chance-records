"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface RowAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[];
  data: T[];
  actions?: RowAction<T>[];
  onSelect?: (ids: number[]) => void;
  bulkActions?: { label: string; onClick: (ids: number[]) => void }[];
}

export default function DataTable<T extends { id: number }>({
  columns,
  data,
  actions,
  onSelect,
  bulkActions,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSelect(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onSelect?.(Array.from(next));
  }

  function toggleAll() {
    if (selected.size === data.length) {
      setSelected(new Set());
      onSelect?.([]);
    } else {
      const all = new Set(data.map((d) => d.id));
      setSelected(all);
      onSelect?.(Array.from(all));
    }
  }

  function handleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv));
        return sortAsc ? cmp : -cmp;
      })
    : data;

  return (
    <div>
      {bulkActions && selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-white/5 rounded-sm">
          <span className="text-sm text-cream/70">{selected.size} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="outline"
              onClick={() => action.onClick(Array.from(selected))}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {(onSelect || bulkActions) && (
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="accent-brick"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-left font-mono uppercase text-xs tracking-wider text-muted cursor-pointer hover:text-cream select-none"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? "\u2191" : "\u2193"}</span>
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="p-2 text-right font-mono uppercase text-xs tracking-wider text-muted">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 text-cream">
                {(onSelect || bulkActions) && (
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="accent-brick"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="p-2">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      {actions.map((action) => (
                        <Button
                          key={action.label}
                          size="sm"
                          variant={action.variant ?? "ghost"}
                          className={action.className}
                          onClick={() => action.onClick(item)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0) + (onSelect || bulkActions ? 1 : 0)}
                  className="p-8 text-center text-muted"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

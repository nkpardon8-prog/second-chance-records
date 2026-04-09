"use client";

import { useState } from "react";
import {
  createRecord,
  updateRecord,
  deleteRecord,
  reorderRecords,
} from "@/lib/actions/records";
import SortableList from "@/components/admin/SortableList";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { FeaturedRecord } from "@/types";

const categories = ["New Arrivals", "Staff Picks", "Local Artists"];

const recordFields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "artist", label: "Artist", type: "text" },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: categories.map((c) => ({ label: c, value: c })),
  },
  { name: "discogsUrl", label: "Discogs URL", type: "url", required: true },
  { name: "imageUrl", label: "Image URL", type: "url" },
  { name: "description", label: "Description", type: "textarea" },
];

interface AdminRecordsClientProps {
  records: FeaturedRecord[];
}

export default function AdminRecordsClient({ records }: AdminRecordsClientProps) {
  const [activeTab, setActiveTab] = useState(categories[0]);
  const [editing, setEditing] = useState<FeaturedRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = records.filter((r) => r.category === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Featured Records</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Record"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">New Record</h3>
          <ItemForm
            fields={recordFields}
            initialValues={{ category: activeTab }}
            onSubmit={async (fd) => {
              await createRecord(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Record"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">Edit Record</h3>
          <ItemForm
            fields={recordFields}
            initialValues={{
              title: editing.title,
              artist: editing.artist ?? "",
              category: editing.category,
              discogsUrl: editing.discogsUrl,
              imageUrl: editing.imageUrl ?? "",
              description: editing.description ?? "",
            }}
            onSubmit={async (fd) => {
              await updateRecord(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Record"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeTab === cat
                ? "bg-[var(--color-accent)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <SortableList
        items={filtered}
        renderItem={(rec) => (
          <div>
            <p className="font-medium text-sm">{rec.title}</p>
            <p className="text-xs text-gray-500">
              {rec.artist && `${rec.artist} - `}{rec.category}
            </p>
          </div>
        )}
        onReorder={reorderRecords}
        onEdit={(rec) => { setEditing(rec); setShowAdd(false); }}
        onDelete={(id) => {
          if (confirm("Delete this record?")) deleteRecord(id);
        }}
      />
    </div>
  );
}

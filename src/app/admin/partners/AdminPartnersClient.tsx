"use client";

import { useState } from "react";
import {
  createPartner,
  updatePartner,
  deletePartner,
  reorderPartners,
} from "@/lib/actions/partners";
import SortableList from "@/components/admin/SortableList";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { Partner } from "@/types";

const partnerFields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "url", label: "URL", type: "url", required: true },
  { name: "logoUrl", label: "Logo URL", type: "url" },
  { name: "description", label: "Description", type: "textarea" },
];

interface AdminPartnersClientProps {
  partners: Partner[];
}

export default function AdminPartnersClient({ partners }: AdminPartnersClientProps) {
  const [editing, setEditing] = useState<Partner | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Partners</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Partner"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">New Partner</h3>
          <ItemForm
            fields={partnerFields}
            onSubmit={async (fd) => {
              await createPartner(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Partner"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">Edit Partner</h3>
          <ItemForm
            fields={partnerFields}
            initialValues={{
              name: editing.name,
              url: editing.url,
              logoUrl: editing.logoUrl ?? "",
              description: editing.description ?? "",
            }}
            onSubmit={async (fd) => {
              await updatePartner(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Partner"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <SortableList
        items={partners}
        renderItem={(p) => (
          <div>
            <p className="font-medium text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 truncate">{p.url}</p>
          </div>
        )}
        onReorder={reorderPartners}
        onEdit={(p) => { setEditing(p); setShowAdd(false); }}
        onDelete={(id) => {
          if (confirm("Delete this partner?")) deletePartner(id);
        }}
      />
    </div>
  );
}

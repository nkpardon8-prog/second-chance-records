"use client";

import { useState } from "react";
import {
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/actions/resources";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { CommunityResource } from "@/types";

const resourceFields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "url", label: "URL", type: "url", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

interface AdminResourcesClientProps {
  resources: CommunityResource[];
}

export default function AdminResourcesClient({ resources }: AdminResourcesClientProps) {
  const [editing, setEditing] = useState<CommunityResource | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Community Resources</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Resource"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">New Resource</h3>
          <ItemForm
            fields={resourceFields}
            onSubmit={async (fd) => {
              await createResource(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Resource"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">Edit Resource</h3>
          <ItemForm
            fields={resourceFields}
            initialValues={{
              name: editing.name,
              url: editing.url,
              description: editing.description ?? "",
            }}
            onSubmit={async (fd) => {
              await updateResource(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Resource"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="space-y-2">
        {resources.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-gray-500 truncate">{r.url}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setShowAdd(false); }}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => {
                  if (confirm("Delete this resource?")) deleteResource(r.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No resources yet.</p>
        )}
      </div>
    </div>
  );
}

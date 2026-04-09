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
        <h2 className="font-heading text-2xl text-cream tracking-wide">Community Resources</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Resource"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Resource</h3>
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
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Resource</h3>
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
            className="flex items-center justify-between bg-card border border-white/5 rounded-sm p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-cream">{r.name}</p>
              <p className="text-xs text-muted truncate">{r.url}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setShowAdd(false); }}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
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
          <p className="text-sm text-muted text-center py-8">No resources yet.</p>
        )}
      </div>
    </div>
  );
}

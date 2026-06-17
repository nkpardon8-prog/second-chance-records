"use client";

import { useState } from "react";
import {
  createPillar,
  updatePillar,
  deletePillar,
} from "@/lib/actions/pillars";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { Pillar } from "@/types";

const pillarFields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "linkUrl", label: "Link URL (optional)", type: "url" },
  { name: "linkLabel", label: "Link button text (optional)", type: "text" },
];

interface AdminPillarsClientProps {
  pillars: Pillar[];
}

export default function AdminPillarsClient({ pillars }: AdminPillarsClientProps) {
  const [editing, setEditing] = useState<Pillar | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Mission Pillars</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Pillar"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Pillar</h3>
          <ItemForm
            fields={pillarFields}
            onSubmit={async (fd) => {
              await createPillar(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Pillar"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Pillar</h3>
          <ItemForm
            fields={pillarFields}
            initialValues={{
              title: editing.title,
              description: editing.description,
              linkUrl: editing.linkUrl ?? "",
              linkLabel: editing.linkLabel ?? "",
            }}
            onSubmit={async (fd) => {
              await updatePillar(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Pillar"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Current Pillars</h3>
      <div className="space-y-2">
        {pillars.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-card border border-white/5 rounded-sm p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-cream">{p.title}</p>
              <p className="text-xs text-kraft/70 truncate">
                {p.linkUrl ? p.linkUrl : "No link"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setShowAdd(false); }}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
                onClick={() => {
                  if (confirm("Delete this pillar?")) deletePillar(p.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {pillars.length === 0 && (
          <p className="text-sm text-kraft/70 text-center py-8">No pillars yet.</p>
        )}
      </div>
    </div>
  );
}

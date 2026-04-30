"use client";

import { useState } from "react";
import {
  createPressMention,
  updatePressMention,
  deletePressMention,
  reorderPressMentions,
} from "@/lib/actions/press-mentions";
import SortableList from "@/components/admin/SortableList";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { PressMention } from "@/types";

const pressMentionFields: FieldDef[] = [
  { name: "name", label: "Publication Name", type: "text", required: true },
  { name: "url", label: "Article URL", type: "url", required: true },
];

interface AdminPressMentionsClientProps {
  pressMentions: PressMention[];
}

export default function AdminPressMentionsClient({ pressMentions }: AdminPressMentionsClientProps) {
  const [editing, setEditing] = useState<PressMention | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Press Mentions</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Press Mention"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Press Mention</h3>
          <ItemForm
            fields={pressMentionFields}
            onSubmit={async (fd) => {
              await createPressMention(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Press Mention"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Press Mention</h3>
          <ItemForm
            fields={pressMentionFields}
            initialValues={{
              name: editing.name,
              url: editing.url,
            }}
            onSubmit={async (fd) => {
              await updatePressMention(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Press Mention"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <SortableList
        items={pressMentions}
        renderItem={(p) => (
          <div>
            <p className="font-medium text-sm text-cream">{p.name}</p>
            <p className="text-xs text-muted truncate">{p.url}</p>
          </div>
        )}
        onReorder={reorderPressMentions}
        onEdit={(p) => { setEditing(p); setShowAdd(false); }}
        onDelete={(id) => {
          if (confirm("Delete this press mention?")) deletePressMention(id);
        }}
      />
    </div>
  );
}

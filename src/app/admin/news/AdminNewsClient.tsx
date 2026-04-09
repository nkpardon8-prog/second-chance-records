"use client";

import { useState, useTransition } from "react";
import { createNews, updateNews, deleteNews } from "@/lib/actions/news";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { News } from "@/types";

const newsFields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "content", label: "Content", type: "textarea", required: true },
  { name: "imageUrl", label: "Image URL", type: "url" },
];

interface AdminNewsClientProps {
  news: News[];
}

export default function AdminNewsClient({ news }: AdminNewsClientProps) {
  const [editing, setEditing] = useState<News | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  function togglePublish(item: News) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", item.title);
      fd.set("content", item.content);
      fd.set("imageUrl", item.imageUrl ?? "");
      fd.set("isPublished", String(!item.isPublished));
      await updateNews(item.id, fd);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">News</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Post"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Post</h3>
          <ItemForm
            fields={newsFields}
            onSubmit={async (fd) => {
              await createNews(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Post"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Post</h3>
          <ItemForm
            fields={newsFields}
            initialValues={{
              title: editing.title,
              content: editing.content,
              imageUrl: editing.imageUrl ?? "",
            }}
            onSubmit={async (fd) => {
              await updateNews(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Post"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="space-y-2">
        {news.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-card border border-white/5 rounded-sm p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-cream truncate">{item.title}</p>
              <p className="text-xs text-kraft/70">
                {item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString()
                  : "No date"}
                {" - "}
                <span
                  className={
                    item.isPublished ? "text-forest" : "text-gold"
                  }
                >
                  {item.isPublished ? "Published" : "Draft"}
                </span>
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => togglePublish(item)} disabled={pending}>
                {item.isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setShowAdd(false); }}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
                onClick={() => {
                  if (confirm("Delete this post?")) deleteNews(item.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <p className="text-sm text-kraft/70 text-center py-8">No news posts yet.</p>
        )}
      </div>
    </div>
  );
}

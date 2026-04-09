"use client";

import { useState } from "react";
import {
  createReview,
  updateReview,
  deleteReview,
  reorderReviews,
} from "@/lib/actions/reviews";
import SortableList from "@/components/admin/SortableList";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { Review } from "@/types";

const reviewFields: FieldDef[] = [
  { name: "author", label: "Author", type: "text", required: true },
  {
    name: "platform",
    label: "Platform",
    type: "select",
    required: true,
    options: [
      { label: "Google", value: "google" },
      { label: "Yelp", value: "yelp" },
      { label: "Facebook", value: "facebook" },
      { label: "Other", value: "other" },
    ],
  },
  { name: "rating", label: "Rating (1-5)", type: "text" },
  { name: "quote", label: "Quote", type: "textarea", required: true },
];

interface AdminReviewsClientProps {
  reviews: Review[];
}

export default function AdminReviewsClient({ reviews }: AdminReviewsClientProps) {
  const [editing, setEditing] = useState<Review | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Review"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">New Review</h3>
          <ItemForm
            fields={reviewFields}
            onSubmit={async (fd) => {
              await createReview(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Review"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium mb-3">Edit Review</h3>
          <ItemForm
            fields={reviewFields}
            initialValues={{
              author: editing.author,
              platform: editing.platform,
              rating: editing.rating != null ? String(editing.rating) : "",
              quote: editing.quote,
            }}
            onSubmit={async (fd) => {
              await updateReview(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Review"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <SortableList
        items={reviews}
        renderItem={(rev) => (
          <div>
            <p className="font-medium text-sm">&ldquo;{rev.quote.slice(0, 80)}{rev.quote.length > 80 ? "..." : ""}&rdquo;</p>
            <p className="text-xs text-gray-500">
              {rev.author} - {rev.platform}
              {rev.rating != null && ` - ${rev.rating}/5`}
            </p>
          </div>
        )}
        onReorder={reorderReviews}
        onEdit={(rev) => { setEditing(rev); setShowAdd(false); }}
        onDelete={(id) => {
          if (confirm("Delete this review?")) deleteReview(id);
        }}
      />
    </div>
  );
}

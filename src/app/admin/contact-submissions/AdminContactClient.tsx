"use client";

import { useState, useTransition } from "react";
import {
  markSubmissionRead,
  deleteSubmission,
} from "@/lib/actions/contact";
import Button from "@/components/ui/Button";
import type { ContactSubmission } from "@/types";

interface AdminContactClientProps {
  submissions: ContactSubmission[];
}

export default function AdminContactClient({ submissions }: AdminContactClientProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleMarkRead(id: number) {
    startTransition(async () => {
      await markSubmissionRead(id);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this submission?")) return;
    startTransition(async () => {
      await deleteSubmission(id);
    });
  }

  const unread = submissions.filter((s) => !s.isRead).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Contact Submissions</h2>
        {unread > 0 && (
          <p className="text-sm text-brick mt-1 font-mono">{unread} unread</p>
        )}
      </div>

      <div className="space-y-2">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className={`bg-card border rounded-sm p-4 ${
              sub.isRead ? "border-white/5" : "border-brick/30 bg-brick/5"
            }`}
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!sub.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brick shrink-0" />
                  )}
                  <p className="font-medium text-sm text-cream">{sub.name}</p>
                </div>
                <p className="text-xs text-muted">
                  {sub.email}
                  {sub.subject && ` - ${sub.subject}`}
                  {" - "}
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : ""}
                </p>
                {expanded !== sub.id && (
                  <p className="text-sm text-cream/70 mt-1 truncate">{sub.message}</p>
                )}
              </div>
              <span className="text-muted text-xs shrink-0 ml-2 font-mono">
                {expanded === sub.id ? "collapse" : "expand"}
              </span>
            </div>

            {expanded === sub.id && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-sm text-cream/70 whitespace-pre-wrap">{sub.message}</p>
                <div className="flex gap-2 mt-3">
                  {!sub.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkRead(sub.id)}
                      disabled={pending}
                    >
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brick hover:text-brick/80"
                    onClick={() => handleDelete(sub.id)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}

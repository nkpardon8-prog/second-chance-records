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
        <h2 className="text-2xl font-semibold text-gray-900">Contact Submissions</h2>
        {unread > 0 && (
          <p className="text-sm text-red-600 mt-1">{unread} unread</p>
        )}
      </div>

      <div className="space-y-2">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className={`bg-white border rounded-lg p-4 ${
              sub.isRead ? "border-gray-200" : "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
            }`}
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!sub.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />
                  )}
                  <p className="font-medium text-sm">{sub.name}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {sub.email}
                  {sub.subject && ` - ${sub.subject}`}
                  {" - "}
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : ""}
                </p>
                {expanded !== sub.id && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{sub.message}</p>
                )}
              </div>
              <span className="text-gray-400 text-xs shrink-0 ml-2">
                {expanded === sub.id ? "collapse" : "expand"}
              </span>
            </div>

            {expanded === sub.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.message}</p>
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
                    className="text-red-600"
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
          <p className="text-sm text-gray-500 text-center py-8">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}

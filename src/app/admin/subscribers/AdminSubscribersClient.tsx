"use client";

import { useTransition } from "react";
import {
  deleteSubscriber,
  toggleSubscriberActive,
} from "@/lib/actions/subscribers";
import DataTable, { type Column, type RowAction } from "@/components/admin/DataTable";
import Button from "@/components/ui/Button";
import type { Subscriber } from "@/types";

interface AdminSubscribersClientProps {
  subscribers: Subscriber[];
}

export default function AdminSubscribersClient({ subscribers }: AdminSubscribersClientProps) {
  const [pending, startTransition] = useTransition();

  const columns: Column<Subscriber>[] = [
    { key: "email", label: "Email" },
    {
      key: "subscribedAt",
      label: "Subscribed",
      render: (s) =>
        s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : "-",
    },
    {
      key: "isActive",
      label: "Status",
      render: (s) => (
        <span className={s.isActive ? "text-green-600" : "text-gray-400"}>
          {s.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions: RowAction<Subscriber>[] = [
    {
      label: "Toggle Active",
      variant: "ghost",
      onClick: (s) => {
        startTransition(async () => {
          await toggleSubscriberActive(s.id);
        });
      },
    },
    {
      label: "Delete",
      variant: "ghost",
      className: "text-red-600",
      onClick: (s) => {
        if (confirm("Delete this subscriber?")) {
          startTransition(async () => {
            await deleteSubscriber(s.id);
          });
        }
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Subscribers</h2>
          <p className="text-sm text-gray-500 mt-1">
            {subscribers.length} total subscriber{subscribers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a href="/api/admin/subscribers/export" target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline">
            Export CSV
          </Button>
        </a>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <DataTable columns={columns} data={subscribers} actions={actions} />
      </div>
    </div>
  );
}

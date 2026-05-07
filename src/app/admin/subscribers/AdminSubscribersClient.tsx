"use client";

import { useState, useTransition } from "react";
import {
  deleteSubscriber,
  toggleSubscriberActive,
} from "@/lib/actions/subscribers";
import DataTable, { type Column, type RowAction } from "@/components/admin/DataTable";
import Button from "@/components/ui/Button";
import type { Subscriber } from "@/types";

const TASHA_EMAIL = "secondchancerecordsllc@gmail.com"; // matches Footer.tsx:30
const SUBJECT = "Newsletter from Second Chance Records";
const MAILTO_MAX = 1500; // conservative for Gmail-as-handler

interface AdminSubscribersClientProps {
  subscribers: Subscriber[];
}

export default function AdminSubscribersClient({ subscribers }: AdminSubscribersClientProps) {
  const [pending, startTransition] = useTransition();

  const activeEmails = subscribers.filter((s) => s.isActive).map((s) => s.email);
  const noActive = activeEmails.length === 0;
  let mailtoUrl: string | null = null;
  let tooLong = false;
  if (!noActive) {
    const bccEncoded = activeEmails.map(encodeURIComponent).join(",");
    const subjectEncoded = encodeURIComponent(SUBJECT);
    mailtoUrl = `mailto:${TASHA_EMAIL}?bcc=${bccEncoded}&subject=${subjectEncoded}&body=`;
    tooLong = mailtoUrl.length > MAILTO_MAX;
  }
  const composeDisabled = noActive || tooLong;
  const composeReason = noActive
    ? "No active subscribers yet."
    : tooLong
    ? `Subscriber list (${activeEmails.length}) too long for one mailto link. Use Copy BCC List below, then paste into your mail app's BCC field.`
    : null;

  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const handleCopyBcc = async () => {
    try {
      await navigator.clipboard.writeText(activeEmails.join(", "));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  };

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
        <span className={s.isActive ? "text-forest" : "text-kraft/70"}>
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
      className: "text-brick hover:text-brick/80",
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
          <h2 className="font-heading text-2xl text-cream tracking-wide">Subscribers</h2>
          <p className="text-sm text-kraft/70 mt-1 font-mono">
            {subscribers.length} total subscriber{subscribers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {composeDisabled ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled
              aria-describedby="compose-hint"
            >
              Compose Newsletter
            </Button>
          ) : (
            <a href={mailtoUrl ?? "#"}>
              <Button size="sm" variant="outline" type="button">
                Compose Newsletter ({activeEmails.length})
              </Button>
            </a>
          )}
          {tooLong && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleCopyBcc}
              aria-live="polite"
            >
              {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy BCC List"}
            </Button>
          )}
          <a href="/api/admin/subscribers/export" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {composeDisabled && composeReason && (
        <p id="compose-hint" className="text-xs text-kraft/70 mb-4 font-mono">
          {composeReason}
        </p>
      )}

      <div className="bg-card rounded-sm border border-white/5 p-4">
        <DataTable columns={columns} data={subscribers} actions={actions} />
      </div>
    </div>
  );
}

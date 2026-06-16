"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteSubscriber,
  toggleSubscriberActive,
  analyzeSubscriberPaste,
  importSubscribers,
} from "@/lib/actions/subscribers";
import type { ImportPreview } from "@/lib/actions/subscribers";
import DataTable, { type Column, type RowAction } from "@/components/admin/DataTable";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import type { Subscriber } from "@/types";

const TASHA_EMAIL = "secondchancerecordsllc@gmail.com"; // matches Footer.tsx:30
const SUBJECT = "Newsletter from Second Chance Records";
const MAILTO_MAX = 1500; // conservative for Gmail-as-handler

interface AdminSubscribersClientProps {
  subscribers: Subscriber[];
}

export default function AdminSubscribersClient({ subscribers }: AdminSubscribersClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [showImport, setShowImport] = useState(false);
  const [paste, setPaste] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importPending, startImport] = useTransition();

  const importingRef = useRef(false);
  const pasteRef = useRef(""); // mirrors the live textarea so a stale in-flight Analyze can be discarded

  const handleAnalyze = () =>
    startImport(async () => {
      setImportMsg(null);
      const snapshot = paste;
      try {
        const result = await analyzeSubscriberPaste(snapshot);
        if (pasteRef.current !== snapshot) return; // edited mid-analyze → discard; preview must match current text
        setPreview(result);
      } catch (err) {
        if (pasteRef.current !== snapshot) return; // a newer edit owns the panel now
        // surface the action's own message (e.g. the "split into smaller batches" size hint)
        setImportMsg(err instanceof Error ? err.message : "Could not analyze that paste.");
      }
    });
  const handleImport = () => {
    if (importingRef.current) return; // re-entry guard: a double-click must not clobber the result with "Imported 0"
    importingRef.current = true;
    startImport(async () => {
      try {
        const { inserted } = await importSubscribers(paste);
        setImportMsg(`Imported ${inserted} new subscriber${inserted === 1 ? "" : "s"}.`);
        setPaste("");
        pasteRef.current = "";
        setPreview(null);
        router.refresh();
      } catch (err) {
        setImportMsg(err instanceof Error ? err.message : "Import failed — nothing was added.");
      } finally {
        importingRef.current = false;
      }
    });
  };

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
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setShowImport((v) => !v)}
            aria-expanded={showImport}
          >
            Add subscribers
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-4">
          <Textarea
            dark
            label="Paste emails — from a spreadsheet, a column, or a comma list. Names and other columns are ignored."
            rows={6}
            value={paste}
            placeholder={"anita.wente@gmail.com\nfrogrod@gmail.com, stv@mac.com\nAlexander Johnson\tmassagepower@yahoo.com"}
            onChange={(e) => {
              pasteRef.current = e.target.value;
              setPaste(e.target.value);
              setPreview(null);
              setImportMsg(null);
            }}
          />
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleAnalyze}
              disabled={!paste.trim() || importPending}
            >
              {importPending && !preview ? "Analyzing…" : "Analyze"}
            </Button>
            {preview && preview.toImport.length > 0 && (
              <Button
                size="sm"
                variant="primary"
                type="button"
                onClick={handleImport}
                disabled={importPending}
              >
                Import {preview.toImport.length} subscriber{preview.toImport.length === 1 ? "" : "s"}
              </Button>
            )}
          </div>

          {preview && (
            // counts reconcile: to-import (which INCLUDES flagged) + already + skipped = everything parsed.
            // flagged is shown as a parenthetical of to-import, never as a separate addend, so the numbers add up.
            <div className="mt-3 text-sm font-mono text-kraft/70">
              {preview.toImport.length} to import
              {preview.flagged.length > 0 &&
                ` (incl. ${preview.flagged.length} flagged — double-check below)`}{" "}
              · {preview.alreadySubscribed.length} already subscribed · {preview.invalid.length} skipped
            </div>
          )}

          {preview && preview.flagged.length > 0 && (
            <div className="mt-2 text-sm font-mono text-gold">
              <p className="mb-0.5">
                flagged — likely typos, but these WILL be imported (fix your paste and Analyze again to exclude):
              </p>
              <ul className="space-y-0.5">
                {preview.flagged.map((f) => (
                  <li key={f.email}>
                    {f.email} — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview && preview.invalid.length > 0 && (
            <div className="mt-2 text-sm font-mono text-kraft/60">
              <p className="mb-0.5">skipped (not valid)</p>
              <ul className="space-y-0.5">
                {preview.invalid.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {preview && preview.toImport.length === 0 && (
            <p className="mt-3 text-sm font-mono text-kraft/70">Nothing new to import.</p>
          )}

          {importMsg && (
            <p className="mt-3 text-sm font-mono text-cream" aria-live="polite">
              {importMsg}
            </p>
          )}
        </div>
      )}

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

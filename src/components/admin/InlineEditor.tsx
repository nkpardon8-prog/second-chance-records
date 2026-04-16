"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/components/context/AdminContext";
import {
  updatePageContent,
  upsertPageContent,
} from "@/lib/actions/content";

type SaveStatus = "idle" | "saving" | "saved";

interface InlineEditorProps {
  contentId?: number;
  pageSlug?: string;
  sectionKey?: string;
  content: string;
  as?: "div" | "span" | "p" | "h3" | "section";
  className?: string;
  children: React.ReactNode;
}

export default function InlineEditor({
  contentId,
  pageSlug,
  sectionKey,
  content,
  as: Tag = "div",
  className,
  children,
}: InlineEditorProps) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (statusResetRef.current) clearTimeout(statusResetRef.current);
    };
  }, []);

  // Sync content prop into value state when not editing.
  // After router.refresh() delivers a new content prop from the server,
  // useState does NOT re-initialize — this effect keeps value in sync.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isEditing) setValue(content);
  }, [content, isEditing]);

  if (!isAdmin) return <>{children}</>;

  async function performSave(val: string) {
    setError(null);
    setSaveStatus("saving");
    try {
      if (contentId) {
        await updatePageContent(contentId, val);
      } else if (pageSlug && sectionKey) {
        await upsertPageContent(pageSlug, sectionKey, val);
      }
      setSaveStatus("saved");
      router.refresh();
      if (statusResetRef.current) clearTimeout(statusResetRef.current);
      statusResetRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setError("Save failed. Try again.");
      setSaveStatus("idle");
    }
  }

  function scheduleAutoSave(newValue: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSave(newValue), 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setValue(content);
      setIsEditing(false);
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      performSave(value);
    }
  }

  async function handleDone() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await performSave(value);
    setIsEditing(false);
  }

  function handleCancel() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue(content);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            scheduleAutoSave(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] p-3 bg-base text-cream border-2 border-brick rounded-sm font-sans text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleDone}
            disabled={saveStatus === "saving"}
            className="bg-brick text-cream px-4 py-1 rounded-sm font-mono text-xs uppercase disabled:opacity-50"
          >
            Done
          </button>
          <button
            onClick={handleCancel}
            className="border border-cream/30 text-cream px-4 py-1 rounded-sm font-mono text-xs uppercase"
          >
            Cancel
          </button>

          {saveStatus === "saving" && (
            <span className="font-mono text-xs text-muted ml-2">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="font-mono text-xs text-forest ml-2">Saved ✓</span>
          )}

          <span className="font-mono text-xs text-cream/50 ml-auto">
            Ctrl+Enter to save · Esc to cancel
          </span>
        </div>
        {error && (
          <p className="text-brick font-mono text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <Tag
      className={`group relative cursor-pointer ${className || ""}`}
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to edit"
    >
      {children}
      <span className="absolute -inset-2 border-2 border-dashed border-brick/0 group-hover:border-brick/40 rounded-sm pointer-events-none transition-colors" />
      <span className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-brick text-cream rounded-full w-6 h-6 flex items-center justify-center text-xs transition-opacity pointer-events-none">
        ✎
      </span>
    </Tag>
  );
}

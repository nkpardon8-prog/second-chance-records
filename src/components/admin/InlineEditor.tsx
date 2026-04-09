"use client";

import { useState, useTransition } from "react";
import { useIsAdmin } from "@/components/context/AdminContext";
import {
  updatePageContent,
  upsertPageContent,
} from "@/lib/actions/content";

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
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  if (!isAdmin) return <>{children}</>;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        if (contentId) {
          await updatePageContent(contentId, value);
        } else if (pageSlug && sectionKey) {
          await upsertPageContent(pageSlug, sectionKey, value);
        }
        setIsEditing(false);
      } catch {
        setError("Save failed. Try again.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setValue(content);
      setIsEditing(false);
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  }

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] p-3 bg-base text-cream border-2 border-brick rounded-sm font-sans text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brick text-cream px-4 py-1 rounded-sm font-mono text-xs uppercase"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setValue(content);
              setIsEditing(false);
            }}
            className="border border-cream/30 text-cream px-4 py-1 rounded-sm font-mono text-xs uppercase"
          >
            Cancel
          </button>
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

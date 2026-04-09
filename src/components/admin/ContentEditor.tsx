"use client";

import { useState, useTransition } from "react";
import { updatePageContent } from "@/lib/actions/content";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import type { PageContent } from "@/types";

interface ContentEditorProps {
  sections: PageContent[];
}

function formatKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ContentEditor({ sections }: ContentEditorProps) {
  const [values, setValues] = useState<Record<number, string>>(
    Object.fromEntries(sections.map((s) => [s.id, s.content]))
  );
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [pending, startTransition] = useTransition();

  function handleSave(id: number) {
    startTransition(async () => {
      await updatePageContent(id, values[id]);
      setSaved((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [id]: false })), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="bg-card rounded-sm border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono uppercase text-xs tracking-wider text-kraft/70">
              {formatKey(section.sectionKey)}
            </label>
            <span className="text-xs text-kraft/70">{section.contentType}</span>
          </div>
          <Textarea
            value={values[section.id]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [section.id]: e.target.value }))
            }
            className="mb-3 bg-white/5 border-white/10 text-cream placeholder:text-kraft/70"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => handleSave(section.id)}
              disabled={pending}
            >
              {pending ? "Saving..." : "Save"}
            </Button>
            {saved[section.id] && (
              <span className="text-sm text-forest">Saved</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

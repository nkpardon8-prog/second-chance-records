"use client";

import { useState, useTransition, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/admin/ImageUploadField";
import MultiImageUploadField from "@/components/admin/MultiImageUploadField";
import type { EventImage } from "@/types";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "url" | "date" | "email" | "checkbox" | "image" | "images";
  required?: boolean;
  options?: { label: string; value: string }[];
  /** For type "image": which blob folder to upload into (events/news/partners). */
  folder?: "events" | "news" | "partners";
}

interface ItemFormProps {
  fields: FieldDef[];
  onSubmit: (formData: FormData) => Promise<void>;
  initialValues?: Record<string, string | boolean>;
  submitLabel?: string;
  onCancel?: () => void;
  // Generic shape so future News/Partners/etc multi-image migrations can reuse
  // the pattern. parentId = the parent row's id, items = existing related rows.
  relationContext?: {
    parentId: number;
    items: EventImage[];
  };
}

export default function ItemForm({
  fields,
  onSubmit,
  initialValues = {},
  submitLabel = "Save",
  onCancel,
  relationContext,
}: ItemFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(
    Object.fromEntries(
      fields.map((f) => [f.name, initialValues[f.name] ?? (f.type === "checkbox" ? false : "")])
    )
  );
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    for (const [key, val] of Object.entries(values)) {
      fd.set(key, String(val));
    }
    startTransition(async () => {
      await onSubmit(fd);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      if (!Object.keys(initialValues).length) {
        setValues(
          Object.fromEntries(
            fields.map((f) => [f.name, f.type === "checkbox" ? false : ""])
          )
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => {
        if (field.type === "textarea") {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              name={field.name}
              required={field.required}
              dark
              value={values[field.name] as string}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
            />
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="font-mono uppercase text-xs tracking-wider text-cream">
                {field.label}
              </label>
              <select
                name={field.name}
                required={field.required}
                value={values[field.name] as string}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
                className="rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:border-brick focus:ring-1 focus:ring-brick/20 focus:outline-none"
              >
                <option value="" className="bg-card text-cream">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-cream">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "image") {
          return (
            <ImageUploadField
              key={field.name}
              label={field.label}
              value={values[field.name] as string}
              folder={field.folder}
              onChange={(url) =>
                setValues((prev) => ({ ...prev, [field.name]: url }))
              }
            />
          );
        }
        if (field.type === "images") {
          if (!relationContext) {
            return (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="font-mono uppercase text-xs tracking-wider text-cream">
                  {field.label}
                </label>
                <span className="text-xs text-kraft/70">
                  Save the event first, then attach flyers via Edit.
                </span>
              </div>
            );
          }
          return (
            <MultiImageUploadField
              key={field.name}
              eventId={relationContext.parentId}
              images={relationContext.items}
              label={field.label}
            />
          );
        }
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-cream">
              <input
                type="checkbox"
                name={field.name}
                checked={values[field.name] as boolean}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.name]: e.target.checked }))
                }
                className="rounded-sm accent-brick"
              />
              {field.label}
            </label>
          );
        }
        return (
          <Input
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type}
            required={field.required}
            dark
            value={values[field.name] as string}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
            }
          />
        );
      })}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {success && <span className="text-sm text-forest">Saved</span>}
      </div>
    </form>
  );
}

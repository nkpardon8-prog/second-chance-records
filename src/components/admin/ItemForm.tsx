"use client";

import { useState, useTransition, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "url" | "date" | "email" | "checkbox";
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface ItemFormProps {
  fields: FieldDef[];
  onSubmit: (formData: FormData) => Promise<void>;
  initialValues?: Record<string, string | boolean>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function ItemForm({
  fields,
  onSubmit,
  initialValues = {},
  submitLabel = "Save",
  onCancel,
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

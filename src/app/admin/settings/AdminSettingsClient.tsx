"use client";

import { useState, useTransition } from "react";
import { updateSetting } from "@/lib/actions/settings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { SiteSetting } from "@/types";

interface AdminSettingsClientProps {
  settings: SiteSetting[];
}

const groupOrder = ["Contact Info", "Hours", "Social Media", "General"];

export default function AdminSettingsClient({ settings }: AdminSettingsClientProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const grouped = groupOrder
    .map((group) => ({
      group,
      items: settings.filter((s) => s.group === group),
    }))
    .filter((g) => g.items.length > 0);

  const ungrouped = settings.filter(
    (s) => !groupOrder.includes(s.group)
  );
  if (ungrouped.length > 0) {
    grouped.push({ group: "Other", items: ungrouped });
  }

  function handleSave(key: string) {
    startTransition(async () => {
      await updateSetting(key, values[key]);
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    });
  }

  return (
    <div>
      <h2 className="font-heading text-2xl text-cream tracking-wide mb-6">Settings</h2>

      <div className="space-y-8">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <h3 className="font-mono text-sm text-muted mb-3 uppercase tracking-wider">{group}</h3>
            <div className="space-y-3">
              {items.map((setting) => (
                <div
                  key={setting.key}
                  className="bg-card border border-white/5 rounded-sm p-4"
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label={setting.label}
                        value={values[setting.key]}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-cream placeholder:text-muted"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(setting.key)}
                      disabled={pending}
                    >
                      Save
                    </Button>
                  </div>
                  {saved[setting.key] && (
                    <p className="text-sm text-forest mt-1 font-mono">Saved</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

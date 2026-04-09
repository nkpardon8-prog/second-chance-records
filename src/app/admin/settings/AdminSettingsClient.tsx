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
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h2>

      <div className="space-y-8">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <h3 className="text-lg font-medium text-gray-800 mb-3">{group}</h3>
            <div className="space-y-3">
              {items.map((setting) => (
                <div
                  key={setting.key}
                  className="bg-white border border-gray-200 rounded-lg p-4"
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
                    <p className="text-sm text-green-600 mt-1">Saved</p>
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

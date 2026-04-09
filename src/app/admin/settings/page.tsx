import { getSettings } from "@/lib/actions/settings";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <AdminSettingsClient settings={settings} />;
}

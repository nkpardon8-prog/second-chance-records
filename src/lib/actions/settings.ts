"use server";

import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  return db.select().from(siteSettings);
}

export async function getSettingsByGroup(group: string) {
  return db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.group, group));
}

export async function updateSetting(key: string, value: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db
    .update(siteSettings)
    .set({ value })
    .where(eq(siteSettings.key, key));

  revalidatePath("/");
  revalidatePath("/visit");
  revalidatePath("/admin/settings");
}

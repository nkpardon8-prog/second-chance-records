"use server";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseEmails, type FlaggedEmail } from "@/lib/parse-emails";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const emailSchema = z.string().email();
const MAX_PASTE = 200_000;

export interface ImportPreview {
  toImport: string[];
  alreadySubscribed: string[];
  flagged: FlaggedEmail[];
  invalid: string[];
}

// one query; column is case-SENSITIVE unique + legacy rows mixed-case → dedupe case-insensitively
async function existingEmailSet(): Promise<Set<string>> {
  const rows = await db.select({ email: subscribers.email }).from(subscribers);
  return new Set(rows.map((r) => r.email.toLowerCase()));
}

// shared so analyze (preview) and import (write) derive the SAME set. parseEmails already lowercases
// + dedupes within the paste, so intra-paste case-collisions collapse before partition sees them.
function partition(text: string, existing: Set<string>): ImportPreview {
  const { valid, flagged, invalid } = parseEmails(text);
  const zodOk: string[] = [];
  const zodBad: string[] = [];
  for (const e of [...valid, ...flagged.map((f) => f.email)]) {
    (emailSchema.safeParse(e).success ? zodOk : zodBad).push(e); // single pass — no double safeParse
  }
  const toImport = zodOk.filter((e) => !existing.has(e));
  const toImportSet = new Set(toImport);
  return {
    toImport,
    alreadySubscribed: zodOk.filter((e) => existing.has(e)),
    flagged: flagged.filter((f) => toImportSet.has(f.email)),
    invalid: [...invalid, ...zodBad],
  };
}

export async function analyzeSubscriberPaste(text: string): Promise<ImportPreview> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  if (text.length > MAX_PASTE) throw new Error("Paste too large — split it into smaller batches.");
  return partition(text, await existingEmailSet());
}

export async function importSubscribers(text: string): Promise<{ inserted: number }> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  if (text.length > MAX_PASTE) throw new Error("Paste too large — split it into smaller batches.");
  const { toImport } = partition(text, await existingEmailSet());
  if (toImport.length === 0) return { inserted: 0 };
  const inserted = await db
    .insert(subscribers)
    .values(toImport.map((email) => ({ email })))
    .onConflictDoNothing({ target: subscribers.email })
    .returning({ id: subscribers.id });
  revalidatePath("/admin/subscribers");
  return { inserted: inserted.length };
}

export async function getSubscribers() {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  return db.select().from(subscribers).orderBy(subscribers.subscribedAt);
}

export async function deleteSubscriber(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(subscribers).where(eq(subscribers.id, id));

  revalidatePath("/admin/subscribers");
}

export async function toggleSubscriberActive(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.id, id));

  if (!subscriber) throw new Error("Subscriber not found");

  await db
    .update(subscribers)
    .set({ isActive: !subscriber.isActive })
    .where(eq(subscribers.id, id));

  revalidatePath("/admin/subscribers");
}

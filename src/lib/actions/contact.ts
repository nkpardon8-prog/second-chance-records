"use server";

import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { contactSchema } from "@/lib/validations/contact";

const SPAM_INDICATORS = [
  /\bseo\b/i,
  /search engine/i,
  /\bgoogle\b/i,
  /\bbing\b/i,
  /website traffic/i,
  /targeted traffic/i,
  /increase (your )?traffic/i,
  /\branking?s?\b/i,
  /your website/i,
  /web ?design services/i,
  /digital marketing/i,
  /backlinks?/i,
];

function isLikelySpam(...fields: (string | null | undefined)[]): boolean {
  const text = fields.filter(Boolean).join(" ");
  if (!text) return false;
  let hits = 0;
  for (const re of SPAM_INDICATORS) {
    if (re.test(text)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

export async function submitContact(formData: FormData) {
  const honeypot = formData.get("website") as string;
  if (honeypot) return { error: "Invalid submission" };

  const timestamp = Number(formData.get("_timestamp"));
  if (!timestamp || Date.now() - timestamp < 2000) {
    return { error: "Please wait a moment before submitting" };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (isLikelySpam(parsed.data.subject, parsed.data.message)) {
    return { success: true };
  }

  await db.insert(contactSubmissions).values({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject ?? null,
    message: parsed.data.message,
  });

  revalidatePath("/admin/contact");
  return { success: true };
}

export async function getSubmissions() {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function markSubmissionRead(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db
    .update(contactSubmissions)
    .set({ isRead: true })
    .where(eq(contactSubmissions.id, id));

  revalidatePath("/admin/contact");
}

export async function deleteSubmission(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));

  revalidatePath("/admin/contact");
}

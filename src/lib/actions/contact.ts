"use server";

import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { contactSchema } from "@/lib/validations/contact";

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

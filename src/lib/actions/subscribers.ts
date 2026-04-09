"use server";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq, not } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

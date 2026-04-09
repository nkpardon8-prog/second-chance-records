"use server";

import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { reviewSchema } from "@/lib/validations/review";

export async function getReviews() {
  return db.select().from(reviews).orderBy(reviews.sortOrder);
}

export async function createReview(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = reviewSchema.parse({
    author: formData.get("author"),
    platform: formData.get("platform"),
    rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
    quote: formData.get("quote"),
  });

  await db.insert(reviews).values({
    author: parsed.author,
    platform: parsed.platform,
    rating: parsed.rating ?? null,
    quote: parsed.quote,
  });

  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
}

export async function updateReview(id: number, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = reviewSchema.parse({
    author: formData.get("author"),
    platform: formData.get("platform"),
    rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
    quote: formData.get("quote"),
  });

  await db
    .update(reviews)
    .set({
      author: parsed.author,
      platform: parsed.platform,
      rating: parsed.rating ?? null,
      quote: parsed.quote,
    })
    .where(eq(reviews.id, id));

  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: number) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db.delete(reviews).where(eq(reviews.id, id));

  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
}

export async function reorderReviews(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(reviews).set({ sortOrder: i }).where(eq(reviews.id, orderedIds[i]));
  }

  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
}

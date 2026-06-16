import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";

const emailSchema = z.object({
  email: z.string().email("Must be a valid email"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Normalize to lowercase and dedupe CASE-INSENSITIVELY. The subscribers.email unique index is
    // case-SENSITIVE and legacy rows may be mixed-case, so a plain lowercased insert +
    // onConflictDoNothing could create a SECOND row for an existing mixed-case subscriber (e.g. a
    // stored `User@x.com` would not collide with a new lowercased `user@x.com`). This existence check
    // mirrors the admin import's dedup; onConflictDoNothing stays as an exact-case race backstop.
    const email = parsed.data.email.toLowerCase();
    const existing = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(sql`lower(${subscribers.email}) = ${email}`)
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(subscribers)
        .values({ email })
        .onConflictDoNothing({ target: subscribers.email });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

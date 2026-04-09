import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
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

    await db
      .insert(subscribers)
      .values({ email: parsed.data.email })
      .onConflictDoNothing({ target: subscribers.email });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

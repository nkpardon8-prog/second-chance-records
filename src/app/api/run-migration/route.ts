import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Temporary migration endpoint — delete after running once
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== "scr-migrate-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUrl = process.env.DATABASE_URL!;
    const sql = neon(dbUrl);

    const before = await sql`SELECT category, COUNT(*) as count FROM featured_records GROUP BY category`;

    await sql`UPDATE featured_records SET category = 'new_arrivals' WHERE category = 'New Arrivals'`;
    await sql`UPDATE featured_records SET category = 'staff_picks' WHERE category = 'Staff Picks'`;
    await sql`UPDATE featured_records SET category = 'local_artists' WHERE category = 'Local Artists'`;

    const after = await sql`SELECT category, COUNT(*) as count FROM featured_records GROUP BY category`;

    return NextResponse.json({ ok: true, before, after });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

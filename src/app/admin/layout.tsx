import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/admin/login");

  let unreadCount = 0;
  try {
    const [unreadResult] = await db
      .select({ count: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.isRead, false));
    unreadCount = unreadResult?.count ?? 0;
  } catch {
    // DB error should not block the admin layout
  }

  return (
    <AdminLayoutClient
      email={session.email}
      name={session.name}
      unreadCount={unreadCount}
    >
      {children}
    </AdminLayoutClient>
  );
}

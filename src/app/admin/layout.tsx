import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const [unreadResult] = await db
    .select({ count: count() })
    .from(contactSubmissions)
    .where(eq(contactSubmissions.isRead, false));

  const unreadCount = unreadResult?.count ?? 0;

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

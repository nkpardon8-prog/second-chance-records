import { db } from "@/lib/db";
import {
  subscribers,
  contactSubmissions,
  events,
  news,
  instagramPosts,
} from "@/lib/db/schema";
import { eq, count, gte } from "drizzle-orm";
import Card from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const today = new Date().toISOString().split("T")[0];

  const [
    [subscriberResult],
    [unreadResult],
    [upcomingResult],
    [pendingResult],
    [newsResult],
    [instagramResult],
  ] = await Promise.all([
    db.select({ count: count() }).from(subscribers),
    db
      .select({ count: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.isRead, false)),
    db
      .select({ count: count() })
      .from(events)
      .where(gte(events.date, today)),
    db
      .select({ count: count() })
      .from(events)
      .where(eq(events.isPublished, false)),
    db.select({ count: count() }).from(news),
    db.select({ count: count() }).from(instagramPosts),
  ]);

  const stats = [
    { label: "Total Subscribers", value: subscriberResult?.count ?? 0 },
    { label: "Unread Messages", value: unreadResult?.count ?? 0 },
    { label: "Upcoming Events", value: upcomingResult?.count ?? 0 },
    { label: "Pending Review", value: pendingResult?.count ?? 0 },
    { label: "News Posts", value: newsResult?.count ?? 0 },
    { label: "Instagram Posts", value: instagramResult?.count ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

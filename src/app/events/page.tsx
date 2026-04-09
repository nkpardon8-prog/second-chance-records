import type { Metadata } from "next";
import { getEvents } from "@/lib/actions/events";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/events/EventCard";
import PastEventsToggle from "./PastEventsToggle";

export const metadata: Metadata = {
  title: "Events | Second Chance Records",
  description:
    "Live music, listening parties, and community events at Second Chance Records in Portland, OR.",
  openGraph: {
    title: "Events | Second Chance Records",
    description:
      "Upcoming events at Second Chance Records in Portland, OR.",
  },
};

export default async function EventsPage() {
  const allEvents = await getEvents(true);
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = allEvents.filter((e) => e.date >= today);
  const past = allEvents.filter((e) => e.date < today).reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Live music, listening parties, and more">
        Events
      </SectionHeading>

      {upcoming.length > 0 ? (
        <div className="space-y-6 mb-12">
          {upcoming.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              time={event.time}
              description={event.description}
              artistName={event.artistName}
              artistUrl={event.artistUrl}
              imageUrl={event.imageUrl}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-[var(--color-primary)]/60 py-8 mb-12">
          No upcoming events right now. Check back soon!
        </p>
      )}

      {past.length > 0 && <PastEventsToggle events={past} />}
    </div>
  );
}

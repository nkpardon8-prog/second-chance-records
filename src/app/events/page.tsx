import type { Metadata } from "next";
import { getEvents } from "@/lib/actions/events";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/events/EventCard";
import PastEventsToggle from "./PastEventsToggle";
import InlineEditor from "@/components/admin/InlineEditor";

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
    <div className="bg-kraft min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
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
          <InlineEditor pageSlug="events" sectionKey="no-events-message" content="No upcoming events right now. Check back soon!">
            <p className="text-center text-base/60 py-8 mb-12 font-mono">
              No upcoming events right now. Check back soon!
            </p>
          </InlineEditor>
        )}

        {past.length > 0 && <PastEventsToggle events={past} />}
      </div>
    </div>
  );
}

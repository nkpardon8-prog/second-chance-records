"use client";

import { useState } from "react";
import EventCard from "@/components/events/EventCard";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  artistName: string | null;
  artistUrl: string | null;
  imageUrl: string | null;
}

export default function PastEventsToggle({ events }: { events: Event[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 font-mono text-sm text-base/60 hover:text-base transition-colors mb-6 uppercase tracking-wider"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
        {expanded ? "Hide" : "Show"} past events ({events.length})
      </button>

      {expanded && (
        <div className="space-y-6">
          {events.map((event) => (
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
      )}
    </section>
  );
}

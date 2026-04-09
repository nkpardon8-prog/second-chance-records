"use client";

import { useState, useTransition } from "react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
} from "@/lib/actions/events";
import { searchEvents } from "@/lib/actions/discover";
import type { DiscoveredEvent } from "@/lib/actions/discover";
import SortableList from "@/components/admin/SortableList";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { Event } from "@/types";

const eventFields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "time", label: "Time", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "artistName", label: "Artist Name", type: "text" },
  { name: "artistUrl", label: "Artist URL", type: "url" },
  { name: "imageUrl", label: "Image URL", type: "url" },
];

interface AdminEventsClientProps {
  events: Event[];
}

export default function AdminEventsClient({ events }: AdminEventsClientProps) {
  const [editing, setEditing] = useState<Event | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  // Discovery state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DiscoveredEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const pendingReview = events.filter(
    (e) => e.source === "auto" && !e.isPublished
  );
  const published = events.filter((e) => e.isPublished);

  function handlePublish(id: number) {
    startTransition(async () => {
      const fd = new FormData();
      const ev = events.find((e) => e.id === id);
      if (!ev) return;
      fd.set("title", ev.title);
      fd.set("date", ev.date);
      fd.set("time", ev.time ?? "");
      fd.set("description", ev.description ?? "");
      fd.set("artistName", ev.artistName ?? "");
      fd.set("artistUrl", ev.artistUrl ?? "");
      await updateEvent(id, fd);
    });
  }

  function handleDismiss(id: number) {
    startTransition(async () => {
      await deleteEvent(id);
    });
  }

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setSuggestions([]);
    const result = await searchEvents(searchQuery || undefined);
    if (result.error) {
      setSearchError(result.error);
    } else {
      setSuggestions(result.events);
    }
    setSearching(false);
  }

  function handleConfirmSuggestion(event: DiscoveredEvent) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", event.title);
      fd.set("date", event.date);
      fd.set("time", event.time ?? "");
      fd.set("description", event.description);
      fd.set("artistName", event.artist_name ?? "");
      fd.set("artistUrl", "");
      await createEvent(fd);
      setSuggestions((prev) => prev.filter((s) => s !== event));
    });
  }

  function handleDismissSuggestion(event: DiscoveredEvent) {
    setSuggestions((prev) => prev.filter((s) => s !== event));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Events</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Event"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Event</h3>
          <ItemForm
            fields={eventFields}
            onSubmit={async (fd) => {
              await createEvent(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Event"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Event</h3>
          <ItemForm
            fields={eventFields}
            initialValues={{
              title: editing.title,
              date: editing.date,
              time: editing.time ?? "",
              description: editing.description ?? "",
              artistName: editing.artistName ?? "",
              artistUrl: editing.artistUrl ?? "",
              imageUrl: editing.imageUrl ?? "",
            }}
            onSubmit={async (fd) => {
              await updateEvent(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Event"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* AI Event Discovery */}
      <div className="mb-8 bg-card rounded-sm border border-white/5 p-4">
        <h3 className="font-mono text-sm text-gold mb-3 uppercase tracking-wider">
          Discover Events
        </h3>
        <p className="text-xs text-kraft/70 mb-3">
          Search the web for upcoming events. Leave blank to search for Second Chance Records events.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="e.g. Portland vinyl pop-ups this month..."
            className="flex-1 bg-base border border-white/10 rounded-sm px-3 py-1.5 text-sm text-cream placeholder:text-kraft/40 focus:outline-none focus:border-gold/50"
          />
          <Button size="sm" variant="secondary" onClick={handleSearch} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchError && (
          <p className="text-xs text-brick mt-2">{searchError}</p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions.map((event, i) => (
              <div
                key={`${event.title}-${event.date}-${i}`}
                className="flex items-start justify-between gap-3 bg-gold/10 border border-gold/20 rounded-sm p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-cream">{event.title}</p>
                  <p className="text-xs text-kraft/70">
                    {event.date} {event.time && `at ${event.time}`}
                    {event.artist_name && ` — ${event.artist_name}`}
                  </p>
                  <p className="text-xs text-kraft/50 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gold/70 hover:text-gold mt-1 inline-block"
                    >
                      Source
                    </a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleConfirmSuggestion(event)}
                    disabled={pending}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brick hover:text-brick/80"
                    onClick={() => handleDismissSuggestion(event)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && suggestions.length === 0 && searchError === null && (
          <p className="text-xs text-kraft/40 mt-2">
            Results will appear here after searching.
          </p>
        )}
      </div>

      {pendingReview.length > 0 && (
        <div className="mb-8">
          <h3 className="font-mono text-sm text-gold mb-3 uppercase tracking-wider">
            Auto-Discovered — Pending Review ({pendingReview.length})
          </h3>
          <div className="space-y-2">
            {pendingReview.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between bg-gold/10 border border-gold/20 rounded-sm p-3"
              >
                <div>
                  <p className="font-medium text-sm text-cream">{ev.title}</p>
                  <p className="text-xs text-kraft/70">
                    {ev.date} {ev.time && `at ${ev.time}`}
                  </p>
                  {ev.description && (
                    <p className="text-xs text-kraft/50 mt-1 line-clamp-2">
                      {ev.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePublish(ev.id)}
                    disabled={pending}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brick hover:text-brick/80"
                    onClick={() => handleDismiss(ev.id)}
                    disabled={pending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Published Events</h3>
      <SortableList
        items={published}
        renderItem={(ev) => (
          <div>
            <p className="font-medium text-sm text-cream">{ev.title}</p>
            <p className="text-xs text-kraft/70">
              {ev.date} {ev.time && `at ${ev.time}`}
              {ev.artistName && ` - ${ev.artistName}`}
            </p>
          </div>
        )}
        onReorder={reorderEvents}
        onEdit={(ev) => { setEditing(ev); setShowAdd(false); }}
        onDelete={(id) => {
          if (confirm("Delete this event?")) deleteEvent(id);
        }}
      />
    </div>
  );
}

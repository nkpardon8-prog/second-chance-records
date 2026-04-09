"use client";

import { useState, useTransition } from "react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
} from "@/lib/actions/events";
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

      {pendingReview.length > 0 && (
        <div className="mb-8">
          <h3 className="font-mono text-sm text-gold mb-3 uppercase tracking-wider">
            Pending Review ({pendingReview.length})
          </h3>
          <div className="space-y-2">
            {pendingReview.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between bg-gold/10 border border-gold/20 rounded-sm p-3"
              >
                <div>
                  <p className="font-medium text-sm text-cream">{ev.title}</p>
                  <p className="text-xs text-muted">
                    {ev.date} {ev.time && `at ${ev.time}`}
                  </p>
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
            <p className="text-xs text-muted">
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

import { getEvents } from "@/lib/actions/events";
import { db } from "@/lib/db";
import { eventImages } from "@/lib/db/schema";
import { asc, inArray } from "drizzle-orm";
import type { EventImage } from "@/types";
import AdminEventsClient from "./AdminEventsClient";

export default async function AdminEventsPage() {
  const allEvents = await getEvents();

  const eventIds = allEvents.map((e) => e.id);
  const allImages: EventImage[] = eventIds.length
    ? await db
        .select()
        .from(eventImages)
        .where(inArray(eventImages.eventId, eventIds))
        .orderBy(asc(eventImages.eventId), asc(eventImages.sortOrder))
    : [];
  const imagesByEventId: Record<number, EventImage[]> = {};
  for (const img of allImages) {
    (imagesByEventId[img.eventId] ??= []).push(img);
  }

  return <AdminEventsClient events={allEvents} imagesByEventId={imagesByEventId} />;
}
